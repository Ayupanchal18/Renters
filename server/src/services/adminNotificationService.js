import { Alert } from "../../models/Alert.js";
import { User } from "../../models/User.js";
import emailService from "./emailService.js";
import smsService from "./smsService.js";
import { logVerificationEvent } from "../utils/auditUtils.js";

/**
 * Admin Notification Service
 * Handles notification delivery to administrators for alerts and system issues
 * Implements Requirements 3.5 and 8.2 for administrator notifications
 */
export class AdminNotificationService {
    constructor() {
        this.adminContacts = {
            // Default admin contacts - should be configured via environment variables
            email: [
                process.env.ADMIN_EMAIL_PRIMARY || 'admin@example.com',
                process.env.ADMIN_EMAIL_SECONDARY || 'support@example.com'
            ],
            sms: [
                process.env.ADMIN_SMS_PRIMARY || '+1234567890'
            ],
            slack: process.env.SLACK_WEBHOOK_URL || null,
            webhook: process.env.ADMIN_WEBHOOK_URL || null
        };

        this.notificationRules = {
            critical: {
                channels: ['email', 'sms', 'slack'],
                immediate: true,
                escalationMinutes: 15,
                maxRetries: 3
            },
            warning: {
                channels: ['email', 'slack'],
                immediate: false,
                delayMinutes: 5,
                escalationMinutes: 60,
                maxRetries: 2
            },
            info: {
                channels: ['email'],
                immediate: false,
                delayMinutes: 15,
                escalationMinutes: 240,
                maxRetries: 1
            }
        };

        this.notificationQueue = [];
        this.processingQueue = false;

        // Start notification processing
        this.startNotificationProcessor();
    }

    /**
     * Start the notification processor
     */
    startNotificationProcessor() {
        // Process notification queue every 30 seconds
        setInterval(() => {
            this.processNotificationQueue().catch(error => {
                console.error('Error processing notification queue:', error);
            });
        }, 30 * 1000);

        // Check for escalation notifications every 5 minutes
        setInterval(() => {
            this.checkEscalationNotifications().catch(error => {
                console.error('Error checking escalation notifications:', error);
            });
        }, 5 * 60 * 1000);
    }

    /**
     * Send alert notification to administrators
     */
    async sendAlertNotification(alert) {
        try {
            const rule = this.notificationRules[alert.severity];
            if (!rule) {
                console.warn(`No notification rule for severity: ${alert.severity}`);
                return;
            }

            const notification = {
                alertId: alert.alertId,
                alert: alert,
                rule: rule,
                attempts: 0,
                createdAt: new Date(),
                scheduledFor: rule.immediate ? new Date() :
                    new Date(Date.now() + (rule.delayMinutes * 60 * 1000))
            };

            this.notificationQueue.push(notification);

            // Process immediately if critical
            if (alert.severity === 'critical') {
                await this.processNotificationQueue();
            }

            await logVerificationEvent(null, 'admin_notification', 'queued', true, {
                alertId: alert.alertId,
                severity: alert.severity,
                scheduledFor: notification.scheduledFor
            });

        } catch (error) {
            console.error('Error sending alert notification:', error);
            throw error;
        }
    }

    /**
     * Process the notification queue
     */
    async processNotificationQueue() {
        if (this.processingQueue) return;

        this.processingQueue = true;

        try {
            const now = new Date();
            const readyNotifications = this.notificationQueue.filter(n => n.scheduledFor <= now);

            for (const notification of readyNotifications) {
                await this.processNotification(notification);

                // Remove from queue after processing
                const index = this.notificationQueue.indexOf(notification);
                if (index > -1) {
                    this.notificationQueue.splice(index, 1);
                }
            }

        } catch (error) {
            console.error('Error in processNotificationQueue:', error);
        } finally {
            this.processingQueue = false;
        }
    }

    /**
     * Process individual notification
     */
    async processNotification(notification) {
        try {
            const { alert, rule } = notification;
            const results = [];

            // Send notifications via configured channels
            for (const channel of rule.channels) {
                try {
                    const result = await this.sendNotificationViaChannel(alert, channel);
                    results.push(result);

                    // Update alert with notification record
                    await alert.addNotification(channel, result.recipient, result.success, result.error);

                } catch (error) {
                    console.error(`Error sending notification via ${channel}:`, error);
                    results.push({
                        channel,
                        success: false,
                        error: error.message
                    });
                }
            }

            notification.attempts++;

            // Check if all notifications failed and retry is needed
            const allFailed = results.every(r => !r.success);
            if (allFailed && notification.attempts < rule.maxRetries) {
                // Reschedule for retry
                notification.scheduledFor = new Date(Date.now() + (5 * 60 * 1000)); // Retry in 5 minutes
                this.notificationQueue.push(notification);
            }

            await logVerificationEvent(null, 'admin_notification', 'processed', true, {
                alertId: alert.alertId,
                attempts: notification.attempts,
                results: results.map(r => ({ channel: r.channel, success: r.success }))
            });

        } catch (error) {
            console.error('Error processing notification:', error);
        }
    }

    /**
     * Send notification via specific channel
     */
    async sendNotificationViaChannel(alert, channel) {
        switch (channel) {
            case 'email':
                return await this.sendEmailNotification(alert);

            case 'sms':
                return await this.sendSMSNotification(alert);

            case 'slack':
                return await this.sendSlackNotification(alert);

            case 'webhook':
                return await this.sendWebhookNotification(alert);

            default:
                throw new Error(`Unsupported notification channel: ${channel}`);
        }
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(alert) {
        try {
            const subject = `[${alert.severity.toUpperCase()}] OTP System Alert: ${alert.title}`;
            const htmlContent = this.generateEmailContent(alert);

            const results = [];
            for (const email of this.adminContacts.email) {
                try {
                    const result = await emailService.sendAdminAlert(email, subject, htmlContent);
                    results.push({
                        channel: 'email',
                        recipient: email,
                        success: result.success,
                        messageId: result.messageId,
                        error: result.error
                    });
                } catch (error) {
                    results.push({
                        channel: 'email',
                        recipient: email,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Return the first successful result or the first result if all failed
            const successfulResult = results.find(r => r.success);
            return successfulResult || results[0];

        } catch (error) {
            return {
                channel: 'email',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(alert) {
        try {
            const message = this.generateSMSContent(alert);

            const results = [];
            for (const phone of this.adminContacts.sms) {
                try {
                    const result = await smsService.sendAdminAlert(phone, message);
                    results.push({
                        channel: 'sms',
                        recipient: phone,
                        success: result.success,
                        messageSid: result.messageSid,
                        error: result.error
                    });
                } catch (error) {
                    results.push({
                        channel: 'sms',
                        recipient: phone,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Return the first successful result or the first result if all failed
            const successfulResult = results.find(r => r.success);
            return successfulResult || results[0];

        } catch (error) {
            return {
                channel: 'sms',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send Slack notification
     */
    async sendSlackNotification(alert) {
        try {
            if (!this.adminContacts.slack) {
                return {
                    channel: 'slack',
                    success: false,
                    error: 'Slack webhook URL not configured'
                };
            }

            const payload = this.generateSlackPayload(alert);

            const response = await fetch(this.adminContacts.slack, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return {
                    channel: 'slack',
                    recipient: 'slack-channel',
                    success: true
                };
            } else {
                return {
                    channel: 'slack',
                    success: false,
                    error: `Slack API error: ${response.status} ${response.statusText}`
                };
            }

        } catch (error) {
            return {
                channel: 'slack',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send webhook notification
     */
    async sendWebhookNotification(alert) {
        try {
            if (!this.adminContacts.webhook) {
                return {
                    channel: 'webhook',
                    success: false,
                    error: 'Webhook URL not configured'
                };
            }

            const payload = {
                alertId: alert.alertId,
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                description: alert.description,
                affectedServices: alert.affectedServices,
                metrics: alert.metrics,
                context: alert.context,
                createdAt: alert.createdAt,
                escalationLevel: alert.escalationLevel
            };

            const response = await fetch(this.adminContacts.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'OTP-System-AlertManager/1.0'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return {
                    channel: 'webhook',
                    recipient: 'webhook-endpoint',
                    success: true
                };
            } else {
                return {
                    channel: 'webhook',
                    success: false,
                    error: `Webhook error: ${response.status} ${response.statusText}`
                };
            }

        } catch (error) {
            return {
                channel: 'webhook',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate email content for alert
     */
    generateEmailContent(alert) {
        const severityColor = {
            critical: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .alert-header { background-color: ${severityColor[alert.severity]}; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
                .alert-body { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
                .metric { margin: 10px 0; }
                .metric-label { font-weight: bold; }
                .service-list { margin: 5px 0; }
                .context { background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin: 10px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="alert-header">
                <h2>[${alert.severity.toUpperCase()}] ${alert.title}</h2>
                <p>Alert ID: ${alert.alertId}</p>
            </div>
            <div class="alert-body">
                <p><strong>Description:</strong> ${alert.description}</p>
                
                ${alert.affectedServices && alert.affectedServices.length > 0 ? `
                <div class="metric">
                    <span class="metric-label">Affected Services:</span>
                    <div class="service-list">${alert.affectedServices.join(', ')}</div>
                </div>
                ` : ''}
                
                ${alert.metrics ? `
                <div class="metric">
                    <span class="metric-label">Metrics:</span>
                    <ul>
                        ${alert.metrics.failureRate ? `<li>Failure Rate: ${alert.metrics.failureRate.toFixed(1)}%</li>` : ''}
                        ${alert.metrics.errorCount ? `<li>Error Count: ${alert.metrics.errorCount}</li>` : ''}
                        ${alert.metrics.affectedDeliveries ? `<li>Affected Deliveries: ${alert.metrics.affectedDeliveries}</li>` : ''}
                        ${alert.metrics.timeRange ? `<li>Time Range: ${alert.metrics.timeRange}</li>` : ''}
                    </ul>
                </div>
                ` : ''}
                
                <div class="metric">
                    <span class="metric-label">Created:</span> ${alert.createdAt.toLocaleString()}
                </div>
                
                <div class="metric">
                    <span class="metric-label">Escalation Level:</span> ${alert.escalationLevel}
                </div>
                
                ${alert.context && Object.keys(alert.context).length > 0 ? `
                <div class="context">
                    <strong>Additional Context:</strong>
                    <pre>${JSON.stringify(alert.context, null, 2)}</pre>
                </div>
                ` : ''}
            </div>
            <div class="footer">
                <p>This is an automated alert from the OTP Delivery System.</p>
                <p>Please investigate and acknowledge this alert in the admin dashboard.</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate SMS content for alert
     */
    generateSMSContent(alert) {
        let message = `[${alert.severity.toUpperCase()}] OTP Alert: ${alert.title}`;

        if (alert.metrics && alert.metrics.failureRate) {
            message += ` - Failure Rate: ${alert.metrics.failureRate.toFixed(1)}%`;
        }

        if (alert.affectedServices && alert.affectedServices.length > 0) {
            message += ` - Services: ${alert.affectedServices.join(', ')}`;
        }

        message += ` - ID: ${alert.alertId}`;

        // Truncate if too long for SMS
        if (message.length > 160) {
            message = message.substring(0, 157) + '...';
        }

        return message;
    }

    /**
     * Generate Slack payload for alert
     */
    generateSlackPayload(alert) {
        const severityColor = {
            critical: 'danger',
            warning: 'warning',
            info: 'good'
        };

        const fields = [
            {
                title: 'Alert ID',
                value: alert.alertId,
                short: true
            },
            {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true
            },
            {
                title: 'Created',
                value: alert.createdAt.toLocaleString(),
                short: true
            },
            {
                title: 'Escalation Level',
                value: alert.escalationLevel.toString(),
                short: true
            }
        ];

        if (alert.affectedServices && alert.affectedServices.length > 0) {
            fields.push({
                title: 'Affected Services',
                value: alert.affectedServices.join(', '),
                short: false
            });
        }

        if (alert.metrics) {
            let metricsText = '';
            if (alert.metrics.failureRate) metricsText += `Failure Rate: ${alert.metrics.failureRate.toFixed(1)}%\n`;
            if (alert.metrics.errorCount) metricsText += `Error Count: ${alert.metrics.errorCount}\n`;
            if (alert.metrics.timeRange) metricsText += `Time Range: ${alert.metrics.timeRange}`;

            if (metricsText) {
                fields.push({
                    title: 'Metrics',
                    value: metricsText.trim(),
                    short: false
                });
            }
        }

        return {
            text: `OTP System Alert: ${alert.title}`,
            attachments: [
                {
                    color: severityColor[alert.severity],
                    title: alert.title,
                    text: alert.description,
                    fields: fields,
                    footer: 'OTP Delivery System',
                    ts: Math.floor(alert.createdAt.getTime() / 1000)
                }
            ]
        };
    }

    /**
     * Check for escalation notifications
     */
    async checkEscalationNotifications() {
        try {
            const escalatedAlerts = await Alert.find({
                status: { $in: ['active', 'acknowledged'] },
                escalationLevel: { $gt: 1 },
                'escalationHistory.notificationsSent': { $size: 0 }
            });

            for (const alert of escalatedAlerts) {
                await this.sendAlertNotification(alert);

                // Mark escalation as notified
                const lastEscalation = alert.escalationHistory[alert.escalationHistory.length - 1];
                if (lastEscalation) {
                    lastEscalation.notificationsSent = ['email', 'sms'];
                    await alert.save();
                }
            }

        } catch (error) {
            console.error('Error checking escalation notifications:', error);
        }
    }

    /**
     * Send system health summary to administrators
     */
    async sendHealthSummary() {
        try {
            const healthData = await deliveryMetricsService.getSystemHealth();

            if (healthData.overall === 'critical' || healthData.overall === 'degraded') {
                const alert = {
                    alertId: `HEALTH-${Date.now()}`,
                    type: 'system_degradation',
                    severity: healthData.overall === 'critical' ? 'critical' : 'warning',
                    title: `System Health: ${healthData.overall.toUpperCase()}`,
                    description: `Overall system health is ${healthData.overall}`,
                    source: 'system_health',
                    affectedServices: ['all'],
                    context: healthData,
                    createdAt: new Date(),
                    escalationLevel: 1
                };

                await this.sendAlertNotification(alert);
            }

        } catch (error) {
            console.error('Error sending health summary:', error);
        }
    }

    /**
     * Update admin contact configuration
     */
    updateAdminContacts(contacts) {
        this.adminContacts = { ...this.adminContacts, ...contacts };
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(timeRangeHours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000));

            const alerts = await Alert.find({
                createdAt: { $gte: cutoffTime }
            });

            const stats = {
                totalAlerts: alerts.length,
                notificationsSent: 0,
                successfulNotifications: 0,
                failedNotifications: 0,
                channelBreakdown: {},
                queueSize: this.notificationQueue.length
            };

            alerts.forEach(alert => {
                alert.notificationsSent.forEach(notification => {
                    stats.notificationsSent++;

                    if (notification.success) {
                        stats.successfulNotifications++;
                    } else {
                        stats.failedNotifications++;
                    }

                    if (!stats.channelBreakdown[notification.channel]) {
                        stats.channelBreakdown[notification.channel] = {
                            total: 0,
                            successful: 0,
                            failed: 0
                        };
                    }

                    stats.channelBreakdown[notification.channel].total++;
                    if (notification.success) {
                        stats.channelBreakdown[notification.channel].successful++;
                    } else {
                        stats.channelBreakdown[notification.channel].failed++;
                    }
                });
            });

            return stats;

        } catch (error) {
            console.error('Error getting notification stats:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const adminNotificationService = new AdminNotificationService();