import React, { useState, useEffect } from 'react';
import { X, Settings, Phone, Mail, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge.jsx';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
    useDeliveryPreferences, 
    useUpdateDeliveryPreferences, 
    useTestDelivery,
    useServiceStatus 
} from '../../hooks/useAPI';
import { ErrorDisplay } from '../ui/error-boundary';
import { cn } from '../../lib/utils';
import {
    validateServiceStatus,
    convertServicesToArray,
    logServiceStatusError
} from '../../utils/ServiceStatusValidator';
import {
    showSuccessToast,
    showErrorToast,
    OPERATION_CONTEXTS
} from '../../utils/toastNotifications';

/**
 * Delivery Preferences Management Modal
 * Allows users to configure their OTP delivery preferences
 */
const DeliveryPreferencesModal = React.memo(({ isOpen, onClose, user }) => {
    const [preferences, setPreferences] = useState({
        preferredMethod: 'auto',
        allowFallback: true,
        preferredService: null,
        notificationSettings: {
            deliveryConfirmation: true,
            failureAlerts: true,
            retryNotifications: true,
        },
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [testResults, setTestResults] = useState({});

    // API hooks
    const { data: currentPreferences, isLoading: preferencesLoading } = useDeliveryPreferences();
    const { data: serviceStatus } = useServiceStatus();
    const updatePreferencesMutation = useUpdateDeliveryPreferences();
    const testDeliveryMutation = useTestDelivery();

    // Load current preferences
    useEffect(() => {
        if (currentPreferences?.preferences) {
            setPreferences(currentPreferences.preferences);
            setHasChanges(false);
        }
    }, [currentPreferences]);

    // Handle preference changes
    const handlePreferenceChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value,
        }));
        setHasChanges(true);
    };

    const handleNotificationSettingChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                [key]: value,
            },
        }));
        setHasChanges(true);
    };

    // Save preferences
    const handleSave = async () => {
        try {
            const result = await updatePreferencesMutation.mutateAsync(preferences);
            
            if (result.success) {
                setHasChanges(false);
                showSuccessToast(
                    'Delivery preferences updated successfully',
                    OPERATION_CONTEXTS.PREFERENCES_UPDATE
                );
            } else {
                showErrorToast(
                    result.message || 'Failed to update preferences',
                    OPERATION_CONTEXTS.PREFERENCES_UPDATE
                );
            }
        } catch (error) {
            showErrorToast(
                error.message || 'Failed to update preferences',
                OPERATION_CONTEXTS.PREFERENCES_UPDATE
            );
        }
    };

    // Test delivery method
    const handleTestDelivery = async (method, contact) => {
        try {
            setTestResults(prev => ({ ...prev, [method]: { loading: true } }));
            
            const result = await testDeliveryMutation.mutateAsync({ 
                contact, 
                method 
            });
            
            setTestResults(prev => ({
                ...prev,
                [method]: {
                    loading: false,
                    success: result.success,
                    message: result.message,
                    timestamp: new Date(),
                },
            }));

            if (result.success) {
                showSuccessToast(
                    `Test ${method} delivery completed successfully`,
                    OPERATION_CONTEXTS.TEST_DELIVERY
                );
            } else {
                showErrorToast(
                    result.message || `Test ${method} delivery failed`,
                    OPERATION_CONTEXTS.TEST_DELIVERY
                );
            }
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [method]: {
                    loading: false,
                    success: false,
                    message: error.message,
                    timestamp: new Date(),
                },
            }));

            showErrorToast(
                error.message || `Test ${method} delivery failed`,
                OPERATION_CONTEXTS.TEST_DELIVERY
            );
        }
    };

    // Get available services for a method
    const getAvailableServices = (method) => {
        // Validate service status data
        const validation = validateServiceStatus(serviceStatus);
        
        if (!validation.isValid) {
            logServiceStatusError('DeliveryPreferencesModal.getAvailableServices', validation);
            return [];
        }

        // Convert services object to array format for processing
        const servicesArray = convertServicesToArray(validation.data.services);
        
        return servicesArray.filter(service => 
            service.capabilities?.includes(method) && service.status !== 'down'
        );
    };

    // Get service status badge
    const getServiceStatusBadge = (services) => {
        if (!services || services.length === 0) {
            return <Badge variant="destructive" className="text-xs">Unavailable</Badge>;
        }

        const healthyServices = services.filter(s => s.status === 'healthy');
        
        if (healthyServices.length === services.length) {
            return <Badge variant="success" className="text-xs bg-green-100 text-green-800">Available</Badge>;
        } else if (healthyServices.length > 0) {
            return <Badge variant="warning" className="text-xs bg-yellow-100 text-yellow-800">Limited</Badge>;
        } else {
            return <Badge variant="destructive" className="text-xs">Down</Badge>;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="border-b border-gray-200 p-6 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Settings className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Delivery Preferences</h2>
                            <p className="text-sm text-gray-600">Configure how you receive verification codes</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {preferencesLoading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">Loading preferences...</p>
                        </div>
                    )}

                    {!preferencesLoading && (
                        <>
                            {/* Preferred Method */}
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Preferred Delivery Method</h3>
                                <div className="space-y-3">
                                    {[
                                        { value: 'auto', label: 'Automatic', description: 'Let the system choose the best method' },
                                        { value: 'sms', label: 'SMS', description: 'Always try SMS first', icon: Phone },
                                        { value: 'email', label: 'Email', description: 'Always try email first', icon: Mail },
                                    ].map((method) => {
                                        const Icon = method.icon;
                                        const isSelected = preferences.preferredMethod === method.value;
                                        
                                        return (
                                            <div
                                                key={method.value}
                                                className={cn(
                                                    "p-3 border rounded-lg cursor-pointer transition-all",
                                                    isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                                                )}
                                                onClick={() => handlePreferenceChange('preferredMethod', method.value)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {Icon && <Icon className="h-4 w-4 text-gray-600" />}
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">{method.label}</span>
                                                            {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                                                        </div>
                                                        <p className="text-xs text-gray-600">{method.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Fallback Settings */}
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Fallback Options</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="allowFallback" className="text-sm font-medium">
                                                Allow automatic fallback
                                            </Label>
                                            <p className="text-xs text-gray-600">
                                                Try alternative methods if the preferred method fails
                                            </p>
                                        </div>
                                        <Switch
                                            id="allowFallback"
                                            checked={preferences.allowFallback}
                                            onCheckedChange={(checked) => handlePreferenceChange('allowFallback', checked)}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Service Status */}
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Service Status</h3>
                                <div className="space-y-3">
                                    {['sms', 'email'].map((method) => {
                                        const services = getAvailableServices(method);
                                        const contact = method === 'sms' ? user?.phone : user?.email;
                                        const testResult = testResults[method];
                                        
                                        return (
                                            <div key={method} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {method === 'sms' ? (
                                                        <Phone className="h-4 w-4 text-gray-600" />
                                                    ) : (
                                                        <Mail className="h-4 w-4 text-gray-600" />
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium capitalize">{method}</span>
                                                            {getServiceStatusBadge(services)}
                                                        </div>
                                                        <p className="text-xs text-gray-600">
                                                            {services.length} service{services.length !== 1 ? 's' : ''} available
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {testResult && (
                                                        <div className="flex items-center gap-1">
                                                            {testResult.success ? (
                                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                                            ) : (
                                                                <AlertCircle className="h-3 w-3 text-red-600" />
                                                            )}
                                                            <span className="text-xs text-gray-600">
                                                                {testResult.success ? 'Passed' : 'Failed'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleTestDelivery(method, contact)}
                                                        disabled={!contact || testResult?.loading || services.length === 0}
                                                        className="text-xs"
                                                    >
                                                        <TestTube className="h-3 w-3 mr-1" />
                                                        {testResult?.loading ? 'Testing...' : 'Test'}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Notification Settings */}
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification Settings</h3>
                                <div className="space-y-4">
                                    {[
                                        {
                                            key: 'deliveryConfirmation',
                                            label: 'Delivery confirmations',
                                            description: 'Get notified when codes are successfully delivered'
                                        },
                                        {
                                            key: 'failureAlerts',
                                            label: 'Failure alerts',
                                            description: 'Get notified when delivery fails'
                                        },
                                        {
                                            key: 'retryNotifications',
                                            label: 'Retry notifications',
                                            description: 'Get notified about automatic retry attempts'
                                        },
                                    ].map((setting) => (
                                        <div key={setting.key} className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor={setting.key} className="text-sm font-medium">
                                                    {setting.label}
                                                </Label>
                                                <p className="text-xs text-gray-600">{setting.description}</p>
                                            </div>
                                            <Switch
                                                id={setting.key}
                                                checked={preferences.notificationSettings[setting.key]}
                                                onCheckedChange={(checked) => 
                                                    handleNotificationSettingChange(setting.key, checked)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={updatePreferencesMutation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || updatePreferencesMutation.isPending}
                        className="flex-1"
                    >
                        {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </div>
        </div>
    );
});

DeliveryPreferencesModal.displayName = 'DeliveryPreferencesModal';

export default DeliveryPreferencesModal;