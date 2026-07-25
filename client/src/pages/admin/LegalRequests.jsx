import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { authenticatedFetch } from "../../lib/api";
import { toast } from "sonner";
import { 
    Scale, ShieldAlert, ShieldCheck, Clock, CheckCircle2, XCircle, Search, RefreshCw, ExternalLink, MessageSquare, AlertTriangle 
} from "lucide-react";

export default function LegalRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "15"
            });
            if (typeFilter !== "all") queryParams.append("type", typeFilter);
            if (statusFilter !== "all") queryParams.append("status", statusFilter);
            if (search.trim()) queryParams.append("search", search.trim());

            const res = await authenticatedFetch(`/api/legal/admin/requests?${queryParams.toString()}`);
            const data = await res.json();

            if (data.success) {
                setRequests(data.data.requests || []);
                setTotalPages(data.data.pagination?.totalPages || 1);
            } else {
                toast.error("Failed to load legal requests");
            }
        } catch (err) {
            console.error("Error fetching legal requests:", err);
            toast.error("Network error loading requests");
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, statusFilter, search]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleUpdateStatus = async (requestId, newStatus) => {
        setUpdating(true);
        try {
            const res = await authenticatedFetch(`/api/legal/admin/requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    resolutionNotes: resolutionNotes
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Request status updated to ${newStatus}`);
                setSelectedRequest(null);
                setResolutionNotes("");
                fetchRequests();
            } else {
                toast.error(data.message || "Update failed");
            }
        } catch (err) {
            console.error("Error updating legal request:", err);
            toast.error("Failed to update request");
        } finally {
            setUpdating(false);
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case "newsletter_subscriber":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">📧 Newsletter Subscriber</Badge>;
            case "campaign_subscriber":
                return <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold">📢 Campaign Lead</Badge>;
            case "contact_inquiry":
                return <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20">Contact Inquiry</Badge>;
            case "dmca_takedown":
                return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">DMCA Takedown</Badge>;
            case "dpdp_opt_out":
            case "dpdp_erasure":
            case "dpdp_access":
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">DPDP Act Request</Badge>;
            case "scam_report":
                return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Fraud Report</Badge>;
            case "fair_housing_report":
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Fair Housing</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "resolved":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>;
            case "under_review":
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Under Review</Badge>;
            case "rejected":
                return <Badge variant="secondary">Rejected</Badge>;
            default:
                return <Badge variant="destructive">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Scale className="w-6 h-6 text-primary" />
                        Statutory Legal & Compliance Inbox
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage DPDP Act 2023 data requests, DMCA copyright notices, and scam fraud reports.
                    </p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm" className="gap-1.5">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Inbox
                </Button>
            </div>

            {/* Filters Bar */}
            <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search applicant name, email, or URL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs sm:text-sm"
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="All Request Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Request Types</SelectItem>
                            <SelectItem value="newsletter_subscriber">📧 Newsletter Subscribers</SelectItem>
                            <SelectItem value="campaign_subscriber">📢 Campaign Leads</SelectItem>
                            <SelectItem value="contact_inquiry">Contact & Support Inquiries</SelectItem>
                            <SelectItem value="dmca_takedown">DMCA Takedown Notices</SelectItem>
                            <SelectItem value="dpdp_opt_out">DPDP Opt-Out Requests</SelectItem>
                            <SelectItem value="dpdp_erasure">DPDP Data Erasure</SelectItem>
                            <SelectItem value="scam_report">Scam & Fraud Reports</SelectItem>
                            <SelectItem value="fair_housing_report">Fair Housing Violations</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Submissions Table / Cards */}
            {loading ? (
                <div className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading statutory inbox entries...
                </div>
            ) : requests.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground space-y-2">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h3 className="font-bold text-foreground">No Compliance Requests Found</h3>
                    <p className="text-xs">There are no pending or logged legal requests matching your filters.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {requests.map((item) => (
                        <Card key={item._id} className="p-4 hover:border-primary/50 transition-colors">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {getTypeBadge(item.type)}
                                        {getStatusBadge(item.status)}
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                            <Clock className="w-3.5 h-3.5" />
                                            SLA Deadline: {new Date(item.slaDeadline).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="text-sm font-bold text-foreground">
                                        {item.applicantName} ({item.applicantEmail})
                                        {item.applicantPhone && <span className="text-xs font-normal text-muted-foreground ml-2">Phone: {item.applicantPhone}</span>}
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {item.details}
                                    </p>

                                    {item.targetUrl && (
                                        <a href={item.targetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                                            Target URL: {item.targetUrl}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button size="sm" variant="outline" onClick={() => setSelectedRequest(item)}>
                                        Review & Update
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Review Dialog */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <Card className="max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-foreground">Review Statutory Request</h3>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(null)}>✕</Button>
                        </div>

                        <div className="text-xs space-y-2 text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
                            <p><strong className="text-foreground">Type:</strong> {selectedRequest.type}</p>
                            <p><strong className="text-foreground">Applicant:</strong> {selectedRequest.applicantName} ({selectedRequest.applicantEmail})</p>
                            <p><strong className="text-foreground">Details:</strong> {selectedRequest.details}</p>
                            {selectedRequest.targetUrl && <p><strong className="text-foreground">Target URL:</strong> {selectedRequest.targetUrl}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Resolution Notes / Action Taken</label>
                            <textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Enter admin audit notes..."
                                className="w-full h-24 p-2 text-xs rounded-lg border border-border bg-background"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedRequest._id, "under_review")} disabled={updating}>
                                Mark Under Review
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(selectedRequest._id, "rejected")} disabled={updating}>
                                Reject Request
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateStatus(selectedRequest._id, "resolved")} disabled={updating}>
                                Resolve Request
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
