import { Router } from "express";
import { z } from "zod";
import privacySettingsService from "../src/services/privacySettingsService.js";
import dataExportService from "../src/services/dataExportService.js";
import dataCleanupService from "../src/services/dataCleanupService.js";
import {
    authenticateToken,
    validateInput,
    errorHandler,
    sendSuccess
} from "../src/middleware/security.js";
import {
    logDataAccessEvent,
    logAccountEvent
} from "../src/utils/auditUtils.js";

const router = Router();

// Validation schemas
const privacySettingsSchema = z.object({
    dataProcessing: z.object({
        analytics: z.boolean().optional(),
        marketing: z.boolean().optional(),
        personalization: z.boolean().optional(),
        thirdPartySharing: z.boolean().optional()
    }).optional(),
    visibility: z.object({
        profilePublic: z.boolean().optional(),
        showEmail: z.boolean().optional(),
        showPhone: z.boolean().optional(),
        showProperties: z.boolean().optional()
    }).optional(),
    communications: z.object({
        emailMarketing: z.boolean().optional(),
        smsMarketing: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        securityAlerts: z.boolean().optional()
    }).optional(),
    dataRetention: z.object({
        keepSearchHistory: z.boolean().optional(),
        keepViewHistory: z.boolean().optional(),
        autoDeleteInactive: z.boolean().optional(),
        inactiveThresholdDays: z.number().min(30).max(3650).optional()
    }).optional()
});

const dataExportSchema = z.object({
    format: z.enum(['json', 'csv']).default('json'),
    sections: z.array(z.enum([
        'profile', 'properties', 'conversations', 'wishlist',
        'favorites', 'notifications', 'security', 'preferences'
    ])).optional(),
    includeDeleted: z.boolean().default(false),
    includeSensitive: z.boolean().default(false)
});

const consentSchema = z.object({
    analytics: z.boolean().optional(),
    marketing: z.boolean().optional(),
    personalization: z.boolean().optional(),
    thirdPartySharing: z.boolean().optional()
});

const policyAcceptanceSchema = z.object({
    version: z.string().default('1.0')
});

// Get privacy settings
router.get("/settings", authenticateToken, async (req, res) => {
    try {
        const settings = await privacySettingsService.getPrivacySettings(req.user._id);

        await logDataAccessEvent(req.user._id, 'privacy_settings_view', true, {}, req);

        sendSuccess(res, settings, "Privacy settings retrieved successfully");
    } catch (error) {
        console.error('Get privacy settings error:', error);
        await logDataAccessEvent(req.user._id, 'privacy_settings_view', false, { error: error.message }, req);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve privacy settings"
        });
    }
});

// Update privacy settings
router.patch("/settings",
    authenticateToken,
    validateInput({ body: privacySettingsSchema }),
    async (req, res) => {
        try {
            const updatedSettings = await privacySettingsService.updatePrivacySettings(
                req.user._id,
                req.body
            );

            await logAccountEvent(req.user._id, 'privacy_settings_update', true, {
                updatedFields: Object.keys(req.body)
            }, req);

            sendSuccess(res, updatedSettings, "Privacy settings updated successfully");
        } catch (error) {
            console.error('Update privacy settings error:', error);
            await logAccountEvent(req.user._id, 'privacy_settings_update', false, {
                error: error.message,
                attemptedFields: Object.keys(req.body)
            }, req);
            res.status(400).json({
                success: false,
                error: error.message,
                message: "Failed to update privacy settings"
            });
        }
    }
);

// Get privacy compliance status
router.get("/compliance", authenticateToken, async (req, res) => {
    try {
        const compliance = await privacySettingsService.getPrivacyComplianceStatus(req.user._id);

        await logDataAccessEvent(req.user._id, 'privacy_compliance_view', true, {}, req);

        sendSuccess(res, compliance, "Privacy compliance status retrieved successfully");
    } catch (error) {
        console.error('Get privacy compliance error:', error);
        await logDataAccessEvent(req.user._id, 'privacy_compliance_view', false, { error: error.message }, req);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve privacy compliance status"
        });
    }
});

// Get privacy dashboard
router.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        const dashboard = await privacySettingsService.getPrivacyDashboard(req.user._id);

        await logDataAccessEvent(req.user._id, 'privacy_dashboard_view', true, {}, req);

        sendSuccess(res, dashboard, "Privacy dashboard retrieved successfully");
    } catch (error) {
        console.error('Get privacy dashboard error:', error);
        await logDataAccessEvent(req.user._id, 'privacy_dashboard_view', false, { error: error.message }, req);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve privacy dashboard"
        });
    }
});

// Update data processing consent
router.patch("/consent",
    authenticateToken,
    validateInput({ body: consentSchema }),
    async (req, res) => {
        try {
            const updatedConsent = await privacySettingsService.updateDataProcessingConsent(
                req.user._id,
                req.body
            );

            await logAccountEvent(req.user._id, 'data_consent_update', true, {
                consentChanges: req.body
            }, req);

            sendSuccess(res, updatedConsent, "Data processing consent updated successfully");
        } catch (error) {
            console.error('Update consent error:', error);
            await logAccountEvent(req.user._id, 'data_consent_update', false, {
                error: error.message,
                attemptedChanges: req.body
            }, req);
            res.status(400).json({
                success: false,
                error: error.message,
                message: "Failed to update data processing consent"
            });
        }
    }
);

// Accept privacy policy
router.post("/accept-privacy-policy",
    authenticateToken,
    validateInput({ body: policyAcceptanceSchema }),
    async (req, res) => {
        try {
            const result = await privacySettingsService.recordPrivacyPolicyAcceptance(
                req.user._id,
                req.body.version
            );

            await logAccountEvent(req.user._id, 'privacy_policy_accepted', true, {
                version: req.body.version
            }, req);

            sendSuccess(res, result, "Privacy policy acceptance recorded successfully");
        } catch (error) {
            console.error('Accept privacy policy error:', error);
            await logAccountEvent(req.user._id, 'privacy_policy_accepted', false, {
                error: error.message,
                version: req.body.version
            }, req);
            res.status(400).json({
                success: false,
                error: error.message,
                message: "Failed to record privacy policy acceptance"
            });
        }
    }
);

// Accept terms of service
router.post("/accept-terms",
    authenticateToken,
    validateInput({ body: policyAcceptanceSchema }),
    async (req, res) => {
        try {
            const result = await privacySettingsService.recordTermsAcceptance(
                req.user._id,
                req.body.version
            );

            await logAccountEvent(req.user._id, 'terms_accepted', true, {
                version: req.body.version
            }, req);

            sendSuccess(res, result, "Terms of service acceptance recorded successfully");
        } catch (error) {
            console.error('Accept terms error:', error);
            await logAccountEvent(req.user._id, 'terms_accepted', false, {
                error: error.message,
                version: req.body.version
            }, req);
            res.status(400).json({
                success: false,
                error: error.message,
                message: "Failed to record terms acceptance"
            });
        }
    }
);

// Get data export summary
router.get("/export/summary", authenticateToken, async (req, res) => {
    try {
        const summary = await dataExportService.generateExportSummary(req.user._id);

        await logDataAccessEvent(req.user._id, 'data_export_summary', true, {}, req);

        sendSuccess(res, summary, "Data export summary generated successfully");
    } catch (error) {
        console.error('Get export summary error:', error);
        await logDataAccessEvent(req.user._id, 'data_export_summary', false, { error: error.message }, req);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to generate data export summary"
        });
    }
});

// Request data export
router.post("/export",
    authenticateToken,
    validateInput({ body: dataExportSchema }),
    async (req, res) => {
        try {
            // Validate export request
            const validation = await dataExportService.validateExportRequest(req.user._id, req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid export request",
                    details: validation.errors
                });
            }

            // Perform data export
            const exportResult = await dataExportService.exportUserData(req.user._id, req.body);

            if (!exportResult.success) {
                await logDataAccessEvent(req.user._id, 'data_export_request', false, {
                    error: exportResult.error,
                    options: req.body
                }, req);
                return res.status(400).json({
                    success: false,
                    error: exportResult.error,
                    message: "Data export failed"
                });
            }

            // Update user's last export request timestamp
            await privacySettingsService.updatePrivacySettings(req.user._id, {
                lastDataExportRequest: new Date()
            });

            await logDataAccessEvent(req.user._id, 'data_export_request', true, {
                sections: exportResult.metadata.sections,
                sizeBytes: exportResult.metadata.sizeBytes,
                format: req.body.format
            }, req);

            // Return export data
            res.json({
                success: true,
                message: "Data export completed successfully",
                data: exportResult.data,
                metadata: exportResult.metadata,
                errors: exportResult.errors
            });

        } catch (error) {
            console.error('Data export error:', error);
            await logDataAccessEvent(req.user._id, 'data_export_request', false, {
                error: error.message,
                options: req.body
            }, req);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: "Failed to export user data"
            });
        }
    }
);

// Get data cleanup statistics
router.get("/cleanup/stats", authenticateToken, async (req, res) => {
    try {
        const stats = await dataCleanupService.getCleanupStatistics(req.user._id);

        await logDataAccessEvent(req.user._id, 'cleanup_stats_view', true, {}, req);

        sendSuccess(res, stats, "Data cleanup statistics retrieved successfully");
    } catch (error) {
        console.error('Get cleanup stats error:', error);
        await logDataAccessEvent(req.user._id, 'cleanup_stats_view', false, { error: error.message }, req);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve cleanup statistics"
        });
    }
});

// Request account deletion with data cleanup
router.delete("/delete-account",
    authenticateToken,
    async (req, res) => {
        try {
            const { preserveAuditLogs = true, softDelete = false } = req.body;

            // Perform account deletion with data cleanup
            const deletionResult = await dataCleanupService.performAccountDeletion(
                req.user._id,
                { preserveAuditLogs, softDelete }
            );

            if (!deletionResult.success) {
                await logAccountEvent(req.user._id, 'account_deletion_request', false, {
                    error: deletionResult.error,
                    options: { preserveAuditLogs, softDelete }
                }, req);
                return res.status(400).json({
                    success: false,
                    error: deletionResult.error,
                    message: "Account deletion failed"
                });
            }

            await logAccountEvent(req.user._id, 'account_deletion_request', true, {
                deletedRecords: deletionResult.deletedRecords,
                options: { preserveAuditLogs, softDelete }
            }, req);

            res.json({
                success: true,
                message: "Account deletion completed successfully",
                deletedRecords: deletionResult.deletedRecords,
                errors: deletionResult.errors
            });

        } catch (error) {
            console.error('Account deletion error:', error);
            await logAccountEvent(req.user._id, 'account_deletion_request', false, {
                error: error.message
            }, req);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: "Failed to delete account"
            });
        }
    }
);

export default router;