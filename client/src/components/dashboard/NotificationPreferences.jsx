import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge.jsx';
import { 
    Bell, 
    Mail, 
    MessageSquare, 
    Shield, 
    Settings, 
    TestTube,
    RotateCcw,
    Clock,
    Globe
} from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { LoadingStates } from '../ui/loading-states';

/**
 * NotificationPreferences Component
 * Allows users to manage their notification preferences for security events and general notifications
 */
export function NotificationPreferences() {
    const {
        preferences,
        loading,
        error,
        updateSpecificPreference,
        updateGlobalSettings,
        resetToDefault,
        sendTestNotification,
    } = useNotificationPreferences();

    const [testLoading, setTestLoading] = useState({});

    if (loading && !preferences) {
        return <LoadingStates.Card />;
    }

    if (error && !preferences) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        Failed to load notification preferences: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handlePreferenceChange = async (category, type, method, enabled) => {
        try {
            await updateSpecificPreference(category, type, method, enabled);
        } catch (error) {
            console.error('Failed to update preference:', error);
        }
    };

    const handleGlobalSettingChange = async (setting, value) => {
        try {
            await updateGlobalSettings({ [setting]: value });
        } catch (error) {
            console.error('Failed to update global setting:', error);
        }
    };

    const handleQuietHoursChange = async (quietHoursUpdate) => {
        try {
            await updateGlobalSettings({
                quietHours: {
                    ...preferences?.globalSettings?.quietHours,
                    ...quietHoursUpdate
                }
            });
        } catch (error) {
            console.error('Failed to update quiet hours:', error);
        }
    };

    const handleTestNotification = async (type) => {
        setTestLoading(prev => ({ ...prev, [type]: true }));
        try {
            await sendTestNotification(type);
        } catch (error) {
            console.error('Failed to send test notification:', error);
        } finally {
            setTestLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleResetToDefault = async () => {
        try {
            await resetToDefault();
        } catch (error) {
            console.error('Failed to reset preferences:', error);
        }
    };

    const securityEventTypes = [
        {
            key: 'passwordChange',
            title: 'Password Changes',
            description: 'Notifications when your password is changed',
            icon: Shield,
            testable: true,
        },
        {
            key: 'phoneUpdate',
            title: 'Phone Number Updates',
            description: 'Notifications when your phone number is updated',
            icon: MessageSquare,
            testable: true,
        },
        {
            key: 'accountDeletion',
            title: 'Account Deletion',
            description: 'Confirmation when your account is deleted',
            icon: Shield,
            testable: true,
        },
        {
            key: 'loginFromNewDevice',
            title: 'New Device Logins',
            description: 'Alerts when you log in from a new device',
            icon: Shield,
            testable: true,
        },
        {
            key: 'failedLoginAttempts',
            title: 'Failed Login Attempts',
            description: 'Alerts when there are failed login attempts',
            icon: Shield,
            testable: true,
        },
    ];

    const generalNotificationTypes = [
        {
            key: 'propertyUpdates',
            title: 'Property Updates',
            description: 'Notifications about your property listings',
            icon: Bell,
        },
        {
            key: 'messages',
            title: 'Messages',
            description: 'Notifications for new messages',
            icon: MessageSquare,
        },
        {
            key: 'marketing',
            title: 'Marketing & Promotions',
            description: 'Updates about new features and promotions',
            icon: Mail,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Global Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Global Settings
                    </CardTitle>
                    <CardDescription>
                        Master controls for all notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-enabled">Email Notifications</Label>
                            <div className="text-sm text-muted-foreground">
                                Enable all email notifications
                            </div>
                        </div>
                        <Switch
                            id="email-enabled"
                            checked={preferences?.globalSettings?.emailEnabled ?? true}
                            onCheckedChange={(checked) => 
                                handleGlobalSettingChange('emailEnabled', checked)
                            }
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="sms-enabled">SMS Notifications</Label>
                            <div className="text-sm text-muted-foreground">
                                Enable all SMS notifications
                            </div>
                        </div>
                        <Switch
                            id="sms-enabled"
                            checked={preferences?.globalSettings?.smsEnabled ?? false}
                            onCheckedChange={(checked) => 
                                handleGlobalSettingChange('smsEnabled', checked)
                            }
                            disabled={loading}
                        />
                    </div>

                    <Separator />

                    {/* Quiet Hours */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="quiet-hours" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Quiet Hours
                                </Label>
                                <div className="text-sm text-muted-foreground">
                                    Disable notifications during specific hours
                                </div>
                            </div>
                            <Switch
                                id="quiet-hours"
                                checked={preferences?.globalSettings?.quietHours?.enabled ?? false}
                                onCheckedChange={(checked) => 
                                    handleQuietHoursChange({ enabled: checked })
                                }
                                disabled={loading}
                            />
                        </div>

                        {preferences?.globalSettings?.quietHours?.enabled && (
                            <div className="grid grid-cols-2 gap-4 ml-6">
                                <div>
                                    <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                                    <input
                                        id="start-time"
                                        type="time"
                                        value={preferences?.globalSettings?.quietHours?.startTime || '22:00'}
                                        onChange={(e) => 
                                            handleQuietHoursChange({ startTime: e.target.value })
                                        }
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="end-time" className="text-sm">End Time</Label>
                                    <input
                                        id="end-time"
                                        type="time"
                                        value={preferences?.globalSettings?.quietHours?.endTime || '08:00'}
                                        onChange={(e) => 
                                            handleQuietHoursChange({ endTime: e.target.value })
                                        }
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Security Events */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Events
                    </CardTitle>
                    <CardDescription>
                        Get notified about important security events on your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {securityEventTypes.map((eventType) => {
                        const Icon = eventType.icon;
                        const eventPrefs = preferences?.securityEvents?.[eventType.key];

                        return (
                            <div key={eventType.key} className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <Label className="font-medium">{eventType.title}</Label>
                                            <Badge variant="secondary" className="text-xs">Security</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {eventType.description}
                                        </div>
                                    </div>
                                    {eventType.testable && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestNotification(eventType.key)}
                                            disabled={loading || testLoading[eventType.key]}
                                            className="flex items-center gap-1"
                                        >
                                            <TestTube className="h-3 w-3" />
                                            {testLoading[eventType.key] ? 'Sending...' : 'Test'}
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 ml-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor={`${eventType.key}-email`} className="text-sm">
                                                Email
                                            </Label>
                                        </div>
                                        <Switch
                                            id={`${eventType.key}-email`}
                                            checked={eventPrefs?.email ?? true}
                                            onCheckedChange={(checked) =>
                                                handlePreferenceChange('securityEvents', eventType.key, 'email', checked)
                                            }
                                            disabled={loading || !preferences?.globalSettings?.emailEnabled}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor={`${eventType.key}-sms`} className="text-sm">
                                                SMS
                                            </Label>
                                        </div>
                                        <Switch
                                            id={`${eventType.key}-sms`}
                                            checked={eventPrefs?.sms ?? false}
                                            onCheckedChange={(checked) =>
                                                handlePreferenceChange('securityEvents', eventType.key, 'sms', checked)
                                            }
                                            disabled={loading || !preferences?.globalSettings?.smsEnabled}
                                        />
                                    </div>
                                </div>

                                {eventType !== securityEventTypes[securityEventTypes.length - 1] && (
                                    <Separator />
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* General Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        General Notifications
                    </CardTitle>
                    <CardDescription>
                        Manage notifications for platform activities and updates
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {generalNotificationTypes.map((notificationType) => {
                        const Icon = notificationType.icon;
                        const notificationPrefs = preferences?.general?.[notificationType.key];

                        return (
                            <div key={notificationType.key} className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <Label className="font-medium">{notificationType.title}</Label>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {notificationType.description}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 ml-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor={`${notificationType.key}-email`} className="text-sm">
                                                Email
                                            </Label>
                                        </div>
                                        <Switch
                                            id={`${notificationType.key}-email`}
                                            checked={notificationPrefs?.email ?? true}
                                            onCheckedChange={(checked) =>
                                                handlePreferenceChange('general', notificationType.key, 'email', checked)
                                            }
                                            disabled={loading || !preferences?.globalSettings?.emailEnabled}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor={`${notificationType.key}-sms`} className="text-sm">
                                                SMS
                                            </Label>
                                        </div>
                                        <Switch
                                            id={`${notificationType.key}-sms`}
                                            checked={notificationPrefs?.sms ?? false}
                                            onCheckedChange={(checked) =>
                                                handlePreferenceChange('general', notificationType.key, 'sms', checked)
                                            }
                                            disabled={loading || !preferences?.globalSettings?.smsEnabled}
                                        />
                                    </div>
                                </div>

                                {notificationType !== generalNotificationTypes[generalNotificationTypes.length - 1] && (
                                    <Separator />
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Actions
                    </CardTitle>
                    <CardDescription>
                        Manage your notification preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={handleResetToDefault}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset to Default
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}