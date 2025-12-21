import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert.jsx';
import { 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    RefreshCw,
    Bell,
    X
} from 'lucide-react';

/**
 * Alert Dashboard Component
 * Displays system alerts, metrics, and allows alert management
 */
export const AlertDashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [alertMetrics, setAlertMetrics] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch alert data
    const fetchAlerts = async () => {
        try {
            setRefreshing(true);
            const [dashboardResponse, metricsResponse] = await Promise.all([
                fetch('/api/alerts/dashboard'),
                fetch('/api/alerts/metrics/summary')
            ]);

            if (dashboardResponse.ok && metricsResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                const metricsData = await metricsResponse.json();
                
                setAlerts(dashboardData.data.activeAlerts || []);
                setAlertMetrics(dashboardData.data.summary || {});
                setError(null);
            } else {
                throw new Error('Failed to fetch alert data');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Acknowledge alert
    const acknowledgeAlert = async (alertId) => {
        try {
            const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'admin', // In real app, get from auth context
                    username: 'Administrator',
                    notes: 'Acknowledged from dashboard'
                })
            });

            if (response.ok) {
                await fetchAlerts(); // Refresh alerts
            } else {
                throw new Error('Failed to acknowledge alert');
            }
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        }
    };

    // Resolve alert
    const resolveAlert = async (alertId, resolution) => {
        try {
            const response = await fetch(`/api/alerts/${alertId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'admin',
                    username: 'Administrator',
                    resolution: resolution || 'Resolved from dashboard',
                    notes: 'Manually resolved'
                })
            });

            if (response.ok) {
                await fetchAlerts(); // Refresh alerts
                setSelectedAlert(null);
            } else {
                throw new Error('Failed to resolve alert');
            }
        } catch (err) {
            console.error('Error resolving alert:', err);
        }
    };

    // Escalate alert
    const escalateAlert = async (alertId) => {
        try {
            const response = await fetch(`/api/alerts/${alertId}/escalate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: 'Manual escalation from dashboard'
                })
            });

            if (response.ok) {
                await fetchAlerts(); // Refresh alerts
            } else {
                throw new Error('Failed to escalate alert');
            }
        } catch (err) {
            console.error('Error escalating alert:', err);
        }
    };

    useEffect(() => {
        fetchAlerts();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    // Get severity icon and color
    const getSeverityDisplay = (severity) => {
        switch (severity) {
            case 'critical':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-500',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    badgeVariant: 'destructive'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    badgeVariant: 'secondary'
                };
            case 'info':
                return {
                    icon: Info,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    badgeVariant: 'outline'
                };
            default:
                return {
                    icon: Info,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    badgeVariant: 'outline'
                };
        }
    };

    // Format time ago
    const formatTimeAgo = (date) => {
        const now = new Date();
        const alertDate = new Date(date);
        const diffMs = now - alertDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading alerts...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load alerts: {error}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={fetchAlerts}
                    >
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Active</p>
                            <p className="text-2xl font-bold">{alertMetrics.totalActive || 0}</p>
                        </div>
                        <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Critical</p>
                            <p className="text-2xl font-bold text-red-600">{alertMetrics.critical || 0}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Warning</p>
                            <p className="text-2xl font-bold text-yellow-600">{alertMetrics.warning || 0}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-400" />
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Info</p>
                            <p className="text-2xl font-bold text-blue-600">{alertMetrics.info || 0}</p>
                        </div>
                        <Info className="h-8 w-8 text-blue-400" />
                    </div>
                </Card>
            </div>

            {/* Alert List */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Active Alerts</h3>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchAlerts}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-600">No active alerts</p>
                        <p className="text-sm text-gray-400">All systems are operating normally</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert) => {
                            const severityDisplay = getSeverityDisplay(alert.severity);
                            const SeverityIcon = severityDisplay.icon;

                            return (
                                <div
                                    key={alert.alertId}
                                    className={`border rounded-lg p-4 ${severityDisplay.borderColor} ${severityDisplay.bgColor} cursor-pointer hover:shadow-md transition-shadow`}
                                    onClick={() => setSelectedAlert(alert)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            <SeverityIcon className={`h-5 w-5 mt-0.5 ${severityDisplay.color}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className="font-medium">{alert.title}</h4>
                                                    <Badge variant={severityDisplay.badgeVariant}>
                                                        {alert.severity}
                                                    </Badge>
                                                    {alert.escalationLevel > 1 && (
                                                        <Badge variant="outline">
                                                            Level {alert.escalationLevel}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatTimeAgo(alert.createdAt)}
                                                    </span>
                                                    <span>ID: {alert.alertId}</span>
                                                    {alert.affectedServices && alert.affectedServices.length > 0 && (
                                                        <span>Services: {alert.affectedServices.join(', ')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            {alert.status === 'active' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        acknowledgeAlert(alert.alertId);
                                                    }}
                                                >
                                                    Acknowledge
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resolveAlert(alert.alertId);
                                                }}
                                            >
                                                Resolve
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Alert Detail Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Alert Details</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedAlert(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Alert ID</label>
                                    <p className="font-mono text-sm">{selectedAlert.alertId}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Title</label>
                                    <p>{selectedAlert.title}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Description</label>
                                    <p>{selectedAlert.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Severity</label>
                                        <Badge variant={getSeverityDisplay(selectedAlert.severity).badgeVariant}>
                                            {selectedAlert.severity}
                                        </Badge>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <p className="capitalize">{selectedAlert.status}</p>
                                    </div>
                                </div>

                                {selectedAlert.metrics && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Metrics</label>
                                        <div className="bg-gray-50 p-3 rounded text-sm">
                                            {selectedAlert.metrics.failureRate && (
                                                <p>Failure Rate: {selectedAlert.metrics.failureRate.toFixed(1)}%</p>
                                            )}
                                            {selectedAlert.metrics.errorCount && (
                                                <p>Error Count: {selectedAlert.metrics.errorCount}</p>
                                            )}
                                            {selectedAlert.metrics.timeRange && (
                                                <p>Time Range: {selectedAlert.metrics.timeRange}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedAlert.context && Object.keys(selectedAlert.context).length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Context</label>
                                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(selectedAlert.context, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <div className="flex space-x-2 pt-4">
                                    {selectedAlert.status === 'active' && (
                                        <Button
                                            onClick={() => acknowledgeAlert(selectedAlert.alertId)}
                                        >
                                            Acknowledge
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => resolveAlert(selectedAlert.alertId)}
                                    >
                                        Resolve
                                    </Button>
                                    {selectedAlert.escalationLevel < 3 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => escalateAlert(selectedAlert.alertId)}
                                        >
                                            Escalate
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AlertDashboard;