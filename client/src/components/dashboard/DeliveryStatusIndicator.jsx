import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    Loader2, 
    RefreshCw, 
    Phone, 
    Mail,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge.jsx';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';

/**
 * Delivery Status Indicator Component
 * Shows real-time OTP delivery status with progress and retry options
 */
const DeliveryStatusIndicator = React.memo(({
    deliveryStatus,
    deliveryProgress,
    isLoading = false,
    canRetry = false,
    onRetry,
    onRetryWithMethod,
    availableMethods = [],
    className,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [progress, setProgress] = useState(0);

    // Animate progress based on delivery status
    useEffect(() => {
        if (!deliveryStatus) {
            setProgress(0);
            return;
        }

        switch (deliveryStatus.status) {
            case 'pending':
                setProgress(10);
                break;
            case 'sent':
                setProgress(50);
                break;
            case 'delivered':
                setProgress(100);
                break;
            case 'failed':
                setProgress(0);
                break;
            default:
                setProgress(0);
        }
    }, [deliveryStatus?.status]);

    const getStatusIcon = () => {
        if (isLoading) {
            return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
        }

        if (!deliveryStatus) {
            return <Clock className="h-4 w-4 text-gray-400" />;
        }

        switch (deliveryStatus.status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'sent':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
            case 'delivered':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = () => {
        if (!deliveryStatus) return 'gray';

        switch (deliveryStatus.status) {
            case 'pending':
                return 'yellow';
            case 'sent':
                return 'blue';
            case 'delivered':
                return 'green';
            case 'failed':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getStatusMessage = () => {
        if (isLoading) {
            return 'Processing delivery...';
        }

        if (!deliveryStatus) {
            return 'No active delivery';
        }

        switch (deliveryStatus.status) {
            case 'pending':
                return 'Preparing to send verification code...';
            case 'sent':
                return `Code sent via ${deliveryStatus.serviceName || 'delivery service'}`;
            case 'delivered':
                return 'Verification code delivered successfully';
            case 'failed':
                return deliveryStatus.error || 'Delivery failed';
            default:
                return 'Unknown status';
        }
    };

    const getMethodIcon = (method) => {
        switch (method) {
            case 'sms':
                return Phone;
            case 'email':
                return Mail;
            default:
                return Mail;
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    const getEstimatedDeliveryTime = () => {
        if (!deliveryStatus?.estimatedDelivery) return null;
        
        const estimated = new Date(deliveryStatus.estimatedDelivery);
        const now = new Date();
        const diffMs = estimated - now;
        
        if (diffMs <= 0) return 'Any moment now';
        
        const diffSeconds = Math.ceil(diffMs / 1000);
        if (diffSeconds < 60) return `${diffSeconds}s`;
        
        const diffMinutes = Math.ceil(diffSeconds / 60);
        return `${diffMinutes}m`;
    };

    if (!deliveryStatus && !isLoading) {
        return null;
    }

    const statusColor = getStatusColor();

    return (
        <Card className={cn("p-4 border-l-4", {
            'border-l-yellow-500 bg-yellow-50': statusColor === 'yellow',
            'border-l-blue-500 bg-blue-50': statusColor === 'blue',
            'border-l-green-500 bg-green-50': statusColor === 'green',
            'border-l-red-500 bg-red-50': statusColor === 'red',
            'border-l-gray-500 bg-gray-50': statusColor === 'gray',
        }, className)}>
            <div className="space-y-3">
                {/* Main Status */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon()}
                        <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", {
                                'text-yellow-800': statusColor === 'yellow',
                                'text-blue-800': statusColor === 'blue',
                                'text-green-800': statusColor === 'green',
                                'text-red-800': statusColor === 'red',
                                'text-gray-800': statusColor === 'gray',
                            })}>
                                {getStatusMessage()}
                            </p>
                            
                            {deliveryStatus && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {deliveryStatus.deliveryMethod?.toUpperCase() || 'Unknown'}
                                    </Badge>
                                    {deliveryStatus.serviceName && (
                                        <Badge variant="secondary" className="text-xs">
                                            {deliveryStatus.serviceName}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {deliveryStatus && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs"
                        >
                            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                    )}
                </div>

                {/* Progress Bar */}
                {deliveryStatus && deliveryStatus.status !== 'failed' && (
                    <div className="space-y-1">
                        <Progress 
                            value={progress} 
                            className={cn("h-2", {
                                '[&>div]:bg-yellow-500': statusColor === 'yellow',
                                '[&>div]:bg-blue-500': statusColor === 'blue',
                                '[&>div]:bg-green-500': statusColor === 'green',
                            })}
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Delivery Progress</span>
                            {getEstimatedDeliveryTime() && (
                                <span>ETA: {getEstimatedDeliveryTime()}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Retry Options */}
                {canRetry && deliveryStatus?.status === 'failed' && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            disabled={isLoading}
                            className="text-xs"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry Same Method
                        </Button>
                        
                        {availableMethods.length > 1 && availableMethods.map((method) => {
                            if (method.method === deliveryStatus.deliveryMethod) return null;
                            
                            const Icon = getMethodIcon(method.method);
                            return (
                                <Button
                                    key={method.method}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRetryWithMethod?.(method.method)}
                                    disabled={isLoading || !method.available}
                                    className="text-xs"
                                >
                                    <Icon className="h-3 w-3 mr-1" />
                                    Try {method.label}
                                </Button>
                            );
                        })}
                    </div>
                )}

                {/* Detailed Information */}
                {showDetails && deliveryStatus && (
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <span className="ml-2 capitalize">{deliveryStatus.status}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Method:</span>
                                <span className="ml-2 capitalize">{deliveryStatus.deliveryMethod}</span>
                            </div>
                            {deliveryStatus.createdAt && (
                                <div>
                                    <span className="font-medium text-gray-700">Initiated:</span>
                                    <span className="ml-2">{formatTimestamp(deliveryStatus.createdAt)}</span>
                                </div>
                            )}
                            {deliveryStatus.actualDelivery && (
                                <div>
                                    <span className="font-medium text-gray-700">Delivered:</span>
                                    <span className="ml-2">{formatTimestamp(deliveryStatus.actualDelivery)}</span>
                                </div>
                            )}
                        </div>

                        {deliveryStatus.messageId && (
                            <div className="text-xs">
                                <span className="font-medium text-gray-700">Message ID:</span>
                                <span className="ml-2 font-mono text-gray-600">{deliveryStatus.messageId}</span>
                            </div>
                        )}

                        {deliveryStatus.error && (
                            <div className="text-xs">
                                <span className="font-medium text-red-700">Error:</span>
                                <span className="ml-2 text-red-600">{deliveryStatus.error}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
});

DeliveryStatusIndicator.displayName = 'DeliveryStatusIndicator';

export default DeliveryStatusIndicator;