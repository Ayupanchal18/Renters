import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge.jsx';
import { Separator } from '../ui/separator';
import { 
    Shield, 
    Eye, 
    Mail, 
    Database, 
    Download, 
    Trash2, 
    CheckCircle, 
    AlertCircle,
    Settings,
    Lock,
    Globe,
    Bell
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { getHeaders } from '../../lib/api.js';

/**
 * Privacy Settings Section Component
 * Manages user privacy preferences, data export, and GDPR compliance
 */
const PrivacySettingsSection = ({ user, onUpdate }) => {
    const [privacySettings, setPrivacySettings] = useState(null);
    const [complianceStatus, setComplianceStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [exporting, setExporting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadPrivacyData();
    }, []);

    const loadPrivacyData = async () => {
        try {
            setLoading(true);
            
            // Load privacy dashboard data
            const response = await fetch('/api/privacy/dashboard', {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load privacy data');
            }

            const data = await response.json();
            setPrivacySettings(data.data.settings);
            setComplianceStatus(data.data.compliance);

        } catch (error) {
            console.error('Error loading privacy data:', error);
            toast({
                title: "Error",
                description: "Failed to load privacy settings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const updatePrivacySettings = async (section, updates) => {
        try {
            setUpdating(true);

            const response = await fetch('/api/privacy/settings', {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ [section]: updates })
            });

            if (!response.ok) {
                throw new Error('Failed to update privacy settings');
            }

            const data = await response.json();
            setPrivacySettings(data.data);

            toast({
                title: "Success",
                description: "Privacy settings updated successfully"
            });

            if (onUpdate) {
                onUpdate(data.data);
            }

        } catch (error) {
            console.error('Error updating privacy settings:', error);
            toast({
                title: "Error",
                description: "Failed to update privacy settings",
                variant: "destructive"
            });
        } finally {
            setUpdating(false);
        }
    };

    const updateDataProcessingConsent = async (consent) => {
        try {
            setUpdating(true);

            const response = await fetch('/api/privacy/consent', {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(consent)
            });

            if (!response.ok) {
                throw new Error('Failed to update consent');
            }

            await loadPrivacyData(); // Reload to get updated compliance status

            toast({
                title: "Success",
                description: "Data processing consent updated successfully"
            });

        } catch (error) {
            console.error('Error updating consent:', error);
            toast({
                title: "Error",
                description: "Failed to update consent settings",
                variant: "destructive"
            });
        } finally {
            setUpdating(false);
        }
    };

    const exportUserData = async () => {
        try {
            setExporting(true);

            const response = await fetch('/api/privacy/export', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    format: 'json',
                    includeDeleted: false,
                    includeSensitive: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            const data = await response.json();
            
            // Create and download file
            const blob = new Blob([JSON.stringify(data.data, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Success",
                description: "Data export completed successfully"
            });

        } catch (error) {
            console.error('Error exporting data:', error);
            toast({
                title: "Error",
                description: "Failed to export user data",
                variant: "destructive"
            });
        } finally {
            setExporting(false);
        }
    };

    const acceptPrivacyPolicy = async () => {
        try {
            const response = await fetch('/api/privacy/accept-privacy-policy', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ version: '1.0' })
            });

            if (!response.ok) {
                throw new Error('Failed to accept privacy policy');
            }

            await loadPrivacyData();

            toast({
                title: "Success",
                description: "Privacy policy acceptance recorded"
            });

        } catch (error) {
            console.error('Error accepting privacy policy:', error);
            toast({
                title: "Error",
                description: "Failed to record privacy policy acceptance",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Privacy Settings</h3>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </Card>
        );
    }

    if (!privacySettings) {
        return (
            <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Privacy Settings</h3>
                </div>
                <p className="text-gray-500">Failed to load privacy settings</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* GDPR Compliance Status */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Privacy Compliance</h3>
                    </div>
                    <Badge variant={complianceStatus?.gdprCompliant ? "success" : "destructive"}>
                        {complianceStatus?.gdprCompliant ? "Compliant" : "Action Required"}
                    </Badge>
                </div>

                {complianceStatus?.issues && complianceStatus.issues.length > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Action Required</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            {complianceStatus.issues.map((issue, index) => (
                                <li key={index}>• {issue}</li>
                            ))}
                        </ul>
                        {!complianceStatus.rightToBeInformed.privacyPolicyAccepted && (
                            <Button 
                                onClick={acceptPrivacyPolicy}
                                className="mt-3"
                                size="sm"
                            >
                                Accept Privacy Policy
                            </Button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Right to Access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Right to Portability</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Right to Rectification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Right to Erasure</span>
                    </div>
                </div>
            </Card>

            {/* Data Processing Consent */}
            <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Database className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Data Processing Consent</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Control how your data is processed and used by our services.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Analytics & Performance</label>
                            <p className="text-sm text-gray-500">Help us improve our services</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.dataProcessing?.analytics || false}
                            onCheckedChange={(checked) => 
                                updateDataProcessingConsent({ analytics: checked })
                            }
                            disabled={updating}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Marketing Communications</label>
                            <p className="text-sm text-gray-500">Receive promotional content</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.dataProcessing?.marketing || false}
                            onCheckedChange={(checked) => 
                                updateDataProcessingConsent({ marketing: checked })
                            }
                            disabled={updating}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Personalization</label>
                            <p className="text-sm text-gray-500">Customize your experience</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.dataProcessing?.personalization || false}
                            onCheckedChange={(checked) => 
                                updateDataProcessingConsent({ personalization: checked })
                            }
                            disabled={updating}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Third-Party Sharing</label>
                            <p className="text-sm text-gray-500">Share data with partners</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.dataProcessing?.thirdPartySharing || false}
                            onCheckedChange={(checked) => 
                                updateDataProcessingConsent({ thirdPartySharing: checked })
                            }
                            disabled={updating}
                        />
                    </div>
                </div>
            </Card>

            {/* Profile Visibility */}
            <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Eye className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Profile Visibility</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Control what information is visible to other users.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Public Profile</label>
                            <p className="text-sm text-gray-500">Make your profile discoverable</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.visibility?.profilePublic || false}
                            onCheckedChange={(checked) => 
                                updatePrivacySettings('visibility', { profilePublic: checked })
                            }
                            disabled={updating}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Show Email</label>
                            <p className="text-sm text-gray-500">Display email in profile</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.visibility?.showEmail || false}
                            onCheckedChange={(checked) => 
                                updatePrivacySettings('visibility', { showEmail: checked })
                            }
                            disabled={updating}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Show Phone</label>
                            <p className="text-sm text-gray-500">Display phone in profile</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.visibility?.showPhone || false}
                            onCheckedChange={(checked) => 
                                updatePrivacySettings('visibility', { showPhone: checked })
                            }
                            disabled={updating}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Show Properties</label>
                            <p className="text-sm text-gray-500">Display your property listings</p>
                        </div>
                        <Switch
                            checked={privacySettings.privacy?.visibility?.showProperties !== false}
                            onCheckedChange={(checked) => 
                                updatePrivacySettings('visibility', { showProperties: checked })
                            }
                            disabled={updating}
                        />
                    </div>
                </div>
            </Card>

            {/* Data Export & Deletion */}
            <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Download className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Data Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Export or delete your personal data in compliance with GDPR.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Export Your Data</h4>
                            <p className="text-sm text-gray-500">
                                Download all your personal data in JSON format
                            </p>
                        </div>
                        <Button
                            onClick={exportUserData}
                            disabled={exporting}
                            variant="outline"
                        >
                            {exporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Data
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                        <div>
                            <h4 className="font-medium text-red-800">Delete Account</h4>
                            <p className="text-sm text-red-600">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                // This would typically open a confirmation modal
                                toast({
                                    title: "Account Deletion",
                                    description: "This feature requires additional confirmation steps",
                                });
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PrivacySettingsSection;