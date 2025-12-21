import React, { useState, useCallback } from "react";
import { 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    Phone, 
    Mail, 
    Wifi, 
    RefreshCw,
    MessageSquare,
    Clock,
    AlertCircle,
    Info,
    Zap
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useToast } from "../ui/use-toast";
import { 
    useConnectivityTest, 
    useDeliveryDiagnostics, 
    useTroubleshootingInfo,
    useReportIssue,
    useDeliveryHistory,
    useServiceStatus
} from "../../hooks/useAPI";
import {
    validateServiceStatus,
    convertServicesToArray,
    logServiceStatusError
} from "../../utils/ServiceStatusValidator";

const DiagnosticTools = ({ user, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
    const [reportForm, setReportForm] = useState({
        type: "delivery_failure",
        description: "",
        method: "sms",
        contact: ""
    });

    // API hooks
    const connectivityTestMutation = useConnectivityTest();
    const reportIssueMutation = useReportIssue();
    const { data: deliveryHistory } = useDeliveryHistory({ limit: 10 });
    const { data: serviceStatus } = useServiceStatus();
    const { data: troubleshootingInfo } = useTroubleshootingInfo(selectedDeliveryId);
    const { data: deliveryDiagnostics } = useDeliveryDiagnostics(selectedDeliveryId);

    const { toast } = useToast();

    // Get system health overview
    const getSystemHealthOverview = () => {
        // Validate service status data
        const validation = validateServiceStatus(serviceStatus);
        
        if (!validation.isValid) {
            logServiceStatusError('DiagnosticTools.getSystemHealthOverview', validation);
            return { status: 'unknown', message: 'Service status unavailable' };
        }

        // Convert services object to array format for processing
        const services = convertServicesToArray(validation.data.services);

        const healthyServices = services.filter(s => s.status === 'healthy');
        const degradedServices = services.filter(s => s.status === 'degraded');
        const downServices = services.filter(s => s.status === 'down');

        if (downServices.length === services.length) {
            return { status: 'critical', message: 'All services are down' };
        } else if (downServices.length > 0 || degradedServices.length > services.length / 2) {
            return { status: 'warning', message: 'Some services are experiencing issues' };
        } else if (degradedServices.length > 0) {
            return { status: 'degraded', message: 'Minor service issues detected' };
        } else {
            return { status: 'healthy', message: 'All services are operational' };
        }
    };

    // Get recent delivery issues
    const getRecentDeliveryIssues = () => {
        if (!deliveryHistory?.history) return [];
        
        return deliveryHistory.history
            .filter(delivery => delivery.status === 'failed')
            .slice(0, 5);
    };

    // Run connectivity test
    const runConnectivityTest = async (method, contact) => {
        try {
            const result = await connectivityTestMutation.mutateAsync({ method, contact });
            
            toast({
                title: result.success ? "Connectivity Test Passed" : "Connectivity Test Failed",
                description: result.message || `${method.toUpperCase()} connectivity test completed`,
                variant: result.success ? "default" : "destructive",
            });

            return result;
        } catch (error) {
            toast({
                title: "Test Failed",
                description: error.message || "Failed to run connectivity test",
                variant: "destructive",
            });
            return { success: false, error: error.message };
        }
    };

    // Submit issue report
    const submitIssueReport = async () => {
        try {
            const result = await reportIssueMutation.mutateAsync(reportForm);
            
            if (result.success) {
                toast({
                    title: "Report Submitted",
                    description: "Your issue report has been submitted successfully",
                });
                setReportForm({
                    type: "delivery_failure",
                    description: "",
                    method: "sms",
                    contact: ""
                });
            } else {
                toast({
                    title: "Submission Failed",
                    description: result.message || "Failed to submit issue report",
                    variant: "destructive",
                });
            }

            return result;
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: error.message || "Failed to submit issue report",
                variant: "destructive",
            });
            return { success: false, error: error.message };
        }
    };

    const systemHealth = getSystemHealthOverview();
    const recentIssues = getRecentDeliveryIssues();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Diagnostic Tools</h2>
                    <p className="text-sm text-muted-foreground">Test connectivity and troubleshoot delivery issues</p>
                </div>
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'connectivity', label: 'Connectivity Test' },
                        { id: 'history', label: 'Delivery History' },
                        { id: 'report', label: 'Report Issue' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* System Health */}
                        <Card className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="h-5 w-5 text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">System Health</h3>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {systemHealth.status === 'healthy' && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                )}
                                {systemHealth.status === 'degraded' && (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                )}
                                {systemHealth.status === 'warning' && (
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                )}
                                {systemHealth.status === 'critical' && (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className="text-sm font-medium">{systemHealth.message}</span>
                            </div>

                            {serviceStatus?.services && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(serviceStatus.services)
                                        .filter(([key]) => !['ready', 'primary'].includes(key))
                                        .map(([name, status], index) => {
                                            const serviceStatus = status?.ready ? 'healthy' : 'down';
                                            return (
                                                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                                    <span className="text-xs font-medium capitalize text-foreground">{name.replace('-', ' ')}</span>
                                                    <div className="flex items-center gap-1">
                                                        {serviceStatus === 'healthy' && (
                                                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                        )}
                                                        {serviceStatus === 'degraded' && (
                                                            <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                                                        )}
                                                        {serviceStatus === 'down' && (
                                                            <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                        )}
                                                        <span className="text-xs capitalize text-muted-foreground">{serviceStatus}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </Card>

                        {/* Recent Issues */}
                        {recentIssues.length > 0 && (
                            <Card className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    <h3 className="text-sm font-semibold text-foreground">Recent Delivery Issues</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    {recentIssues.map((issue, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/50 rounded">
                                            <div>
                                                <span className="text-xs font-medium text-red-800 dark:text-red-200">
                                                    {issue.method?.toUpperCase()} delivery failed
                                                </span>
                                                <p className="text-xs text-red-600 dark:text-red-400">{issue.error}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDeliveryId(issue._id);
                                                    setActiveTab('history');
                                                }}
                                                className="text-xs"
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => runConnectivityTest('sms', user?.phone)}
                                    disabled={!user?.phone || connectivityTestMutation.isPending}
                                    className="justify-start"
                                >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Test SMS Connectivity
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => runConnectivityTest('email', user?.email)}
                                    disabled={!user?.email || connectivityTestMutation.isPending}
                                    className="justify-start"
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Test Email Connectivity
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Connectivity Test Tab */}
                {activeTab === 'connectivity' && (
                    <div className="space-y-4">
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Connectivity Tests</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Test if your phone number and email can receive verification codes.
                            </p>

                            <div className="space-y-4">
                                {/* SMS Test */}
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-sm font-medium text-foreground">SMS Test</span>
                                            <p className="text-xs text-muted-foreground">{user?.phone || 'No phone number'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => runConnectivityTest('sms', user?.phone)}
                                        disabled={!user?.phone || connectivityTestMutation.isPending}
                                    >
                                        {connectivityTestMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <Wifi className="h-3 w-3 mr-1" />
                                        )}
                                        Test
                                    </Button>
                                </div>

                                {/* Email Test */}
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-sm font-medium text-foreground">Email Test</span>
                                            <p className="text-xs text-muted-foreground">{user?.email || 'No email address'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => runConnectivityTest('email', user?.email)}
                                        disabled={!user?.email || connectivityTestMutation.isPending}
                                    >
                                        {connectivityTestMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <Wifi className="h-3 w-3 mr-1" />
                                        )}
                                        Test
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Delivery History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Delivery History</h3>
                            
                            {deliveryHistory?.history && deliveryHistory.history.length > 0 ? (
                                <div className="space-y-2">
                                    {deliveryHistory.history.map((delivery, index) => (
                                        <div 
                                            key={index} 
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                selectedDeliveryId === delivery._id 
                                                    ? 'border-primary bg-primary/5' 
                                                    : 'border-border hover:border-primary/30'
                                            }`}
                                            onClick={() => setSelectedDeliveryId(delivery._id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {delivery.method === 'sms' ? (
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <div>
                                                        <span className="text-sm font-medium capitalize text-foreground">
                                                            {delivery.method} via {delivery.service}
                                                        </span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(delivery.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {delivery.status === 'delivered' && (
                                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    )}
                                                    {delivery.status === 'failed' && (
                                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    )}
                                                    {delivery.status === 'pending' && (
                                                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                                    )}
                                                    <span className="text-xs capitalize text-muted-foreground">{delivery.status}</span>
                                                </div>
                                            </div>
                                            
                                            {delivery.error && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{delivery.error}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No delivery history available</p>
                            )}
                        </Card>

                        {/* Delivery Details */}
                        {selectedDeliveryId && deliveryDiagnostics && (
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Delivery Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-medium text-muted-foreground">Status:</span>
                                            <span className="ml-2 capitalize text-foreground">{deliveryDiagnostics.status}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-muted-foreground">Method:</span>
                                            <span className="ml-2 capitalize text-foreground">{deliveryDiagnostics.method}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-muted-foreground">Service:</span>
                                            <span className="ml-2 text-foreground">{deliveryDiagnostics.service}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-muted-foreground">Attempts:</span>
                                            <span className="ml-2 text-foreground">{deliveryDiagnostics.retryCount || 1}</span>
                                        </div>
                                    </div>
                                    
                                    {deliveryDiagnostics.error && (
                                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded">
                                            <span className="font-medium text-red-700 dark:text-red-300">Error:</span>
                                            <span className="ml-2 text-red-600 dark:text-red-400">{deliveryDiagnostics.error}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* Report Issue Tab */}
                {activeTab === 'report' && (
                    <div className="space-y-4">
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Report an Issue</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Issue Type
                                    </label>
                                    <select
                                        value={reportForm.type}
                                        onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="delivery_failure">Delivery Failure</option>
                                        <option value="delayed_delivery">Delayed Delivery</option>
                                        <option value="wrong_method">Wrong Delivery Method</option>
                                        <option value="service_unavailable">Service Unavailable</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Delivery Method
                                    </label>
                                    <select
                                        value={reportForm.method}
                                        onChange={(e) => setReportForm({ ...reportForm, method: e.target.value })}
                                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="sms">SMS</option>
                                        <option value="email">Email</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Contact Information
                                    </label>
                                    <input
                                        type="text"
                                        value={reportForm.contact}
                                        onChange={(e) => setReportForm({ ...reportForm, contact: e.target.value })}
                                        placeholder={reportForm.method === 'sms' ? 'Phone number' : 'Email address'}
                                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={reportForm.description}
                                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                        placeholder="Please describe the issue you're experiencing..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <Button
                                    onClick={submitIssueReport}
                                    disabled={!reportForm.description || reportIssueMutation.isPending}
                                    className="w-full"
                                >
                                    {reportIssueMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Submit Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagnosticTools;