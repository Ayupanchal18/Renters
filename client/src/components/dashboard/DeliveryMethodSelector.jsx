import React, { useState, useCallback } from 'react';
import { Phone, Mail, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge.jsx';
import { cn } from '../../lib/utils';

/**
 * Delivery Method Selector Component
 * Allows users to choose their preferred OTP delivery method
 * Shows service status and availability
 */
const DeliveryMethodSelector = React.memo(({
    availableMethods = [],
    selectedMethod,
    onMethodSelect,
    serviceStatus,
    disabled = false,
    showPreferences = true,
    className,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleMethodSelect = useCallback((method) => {
        onMethodSelect?.(method);
    }, [onMethodSelect]);

    const getMethodIcon = useCallback((method) => {
        switch (method) {
            case 'sms':
                return Phone;
            case 'email':
                return Mail;
            default:
                return Mail;
        }
    }, []);

    const getServiceStatusBadge = useCallback((services) => {
        if (!services || services.length === 0) {
            return (
                <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unavailable
                </Badge>
            );
        }

        const healthyServices = services.filter(s => s.status === 'healthy');
        const degradedServices = services.filter(s => s.status === 'degraded');

        if (healthyServices.length === services.length) {
            return (
                <Badge variant="success" className="text-xs bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                </Badge>
            );
        } else if (healthyServices.length > 0) {
            return (
                <Badge variant="warning" className="text-xs bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Limited
                </Badge>
            );
        } else {
            return (
                <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Down
                </Badge>
            );
        }
    }, []);

    const getMethodDescription = useCallback((method, services) => {
        if (!services || services.length === 0) {
            return `${method === 'sms' ? 'SMS' : 'Email'} delivery is currently unavailable`;
        }

        const healthyServices = services.filter(s => s.status === 'healthy');
        const primaryService = healthyServices[0] || services[0];

        if (method === 'sms') {
            return `Send verification code via SMS using ${primaryService?.name || 'SMS service'}`;
        } else {
            return `Send verification code via email using ${primaryService?.name || 'Email service'}`;
        }
    }, []);

    if (!availableMethods || availableMethods.length === 0) {
        return (
            <Card className={cn("p-4 border-red-200 bg-red-50", className)}>
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-800">
                            No delivery methods available
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            All delivery services are currently unavailable. Please try again later.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                    Choose delivery method
                </h3>
                {showPreferences && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs"
                    >
                        <Settings className="h-3 w-3 mr-1" />
                        {isExpanded ? 'Hide' : 'Show'} Details
                    </Button>
                )}
            </div>

            <div className="grid gap-2">
                {availableMethods.map((methodInfo) => {
                    const Icon = getMethodIcon(methodInfo.method);
                    const isSelected = selectedMethod === methodInfo.method;
                    const isAvailable = methodInfo.available && methodInfo.services?.length > 0;

                    return (
                        <Card
                            key={methodInfo.method}
                            className={cn(
                                "p-3 cursor-pointer transition-all duration-200 hover:shadow-sm",
                                isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
                                !isAvailable && "opacity-60 cursor-not-allowed",
                                disabled && "cursor-not-allowed opacity-50"
                            )}
                            onClick={() => {
                                if (isAvailable && !disabled) {
                                    handleMethodSelect(methodInfo.method);
                                }
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg flex-shrink-0",
                                    isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600",
                                    !isAvailable && "bg-gray-50 text-gray-400"
                                )}>
                                    <Icon className="h-4 w-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={cn(
                                            "text-sm font-medium",
                                            isSelected ? "text-primary" : "text-gray-900",
                                            !isAvailable && "text-gray-500"
                                        )}>
                                            {methodInfo.label}
                                        </p>
                                        {getServiceStatusBadge(methodInfo.services)}
                                    </div>

                                    <p className="text-xs text-gray-600 mt-1">
                                        {getMethodDescription(methodInfo.method, methodInfo.services)}
                                    </p>

                                    {isExpanded && methodInfo.services && methodInfo.services.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Available services:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {methodInfo.services.map((service, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant={service.status === 'healthy' ? 'secondary' : 'outline'}
                                                        className="text-xs"
                                                    >
                                                        {service.name}
                                                        {service.status === 'degraded' && (
                                                            <AlertCircle className="h-2 w-2 ml-1" />
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {selectedMethod && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <strong>Selected:</strong> {availableMethods.find(m => m.method === selectedMethod)?.label} delivery
                </div>
            )}
        </div>
    );
});

DeliveryMethodSelector.displayName = 'DeliveryMethodSelector';

export default DeliveryMethodSelector;