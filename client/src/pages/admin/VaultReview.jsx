import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { authenticatedFetch, getHeaders } from "../../lib/api";
import { cn } from "../../lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "../../components/ui/dialog";
import { 
    ShieldAlert, Eye, CheckCircle, XCircle, Search, 
    RefreshCw, AlertCircle, Calendar, FileText 
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";

const API_PENDING = "/api/admin/vault/pending";
const API_DOCS = "/api/admin/vault/documents";

export default function VaultReview() {
    const navigate = useNavigate();
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Search/filter state
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Action modals state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [activeDoc, setActiveDoc] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch pending submissions
    const fetchPendingSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await authenticatedFetch(API_PENDING, {
                headers: getHeaders()
            }, navigate);

            const json = await response.json();
            if (json.success) {
                setPendingDocs(json.data);
            } else {
                throw new Error(json.message || "Failed to fetch pending verifications");
            }
        } catch (err) {
            console.error("Fetch pending docs error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchPendingSubmissions();
    }, [fetchPendingSubmissions]);

    // Refresh queue
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPendingSubmissions();
        setRefreshing(false);
    };

    // View file safely via authenticated blob URL
    const handleViewFile = async (docId, filename) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/vault/documents/${docId}/file`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Could not download file from secure storage");
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (err) {
            console.error("View file error:", err);
            showErrorToast(err.message || "Failed to load document file");
        }
    };

    // Approve verification status
    const handleApprove = async (docId) => {
        if (!window.confirm("Are you sure you want to VERIFY this document?")) return;

        setActionLoading(true);
        try {
            const response = await authenticatedFetch(`${API_DOCS}/${docId}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ status: "verified" })
            }, navigate);

            const json = await response.json();
            if (json.success) {
                showSuccessToast("Document verified successfully.");
                fetchPendingSubmissions();
            } else {
                showErrorToast(json.message || "Failed to verify document");
            }
        } catch (err) {
            console.error("Approve document error:", err);
            showErrorToast("Verification action failed.");
        } finally {
            setActionLoading(false);
        }
    };

    // Reject dialog triggers
    const triggerReject = (doc) => {
        setActiveDoc(doc);
        setRejectionReason("");
        setRejectDialogOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            showErrorToast("Please enter a rejection reason.");
            return;
        }

        setActionLoading(true);
        try {
            const response = await authenticatedFetch(`${API_DOCS}/${activeDoc._id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ 
                    status: "rejected",
                    rejectionReason: rejectionReason.trim()
                })
            }, navigate);

            const json = await response.json();
            if (json.success) {
                showSuccessToast("Document rejected with feedback.");
                setRejectDialogOpen(false);
                fetchPendingSubmissions();
            } else {
                showErrorToast(json.message || "Failed to reject document");
            }
        } catch (err) {
            console.error("Reject document error:", err);
            showErrorToast("Rejection action failed.");
        } finally {
            setActionLoading(false);
        }
    };

    // Filters matching search keyword
    const filteredDocs = pendingDocs.filter((doc) => {
        const userName = doc.userId?.name?.toLowerCase() || "";
        const userEmail = doc.userId?.email?.toLowerCase() || "";
        const query = search.toLowerCase();
        
        const matchesSearch = userName.includes(query) || userEmail.includes(query);
        const matchesType = typeFilter === "all" || doc.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const getDocTypeLabel = (type) => {
        switch (type) {
            case "id_proof": return "ID Proof";
            case "address_proof": return "Address Proof";
            case "income_proof": return "Income Proof";
            case "reference_letter": return "Reference Letter";
            default: return "Other Document";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                        Verification Review Queue
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Review user documents (ID, Address, Income) to grant platform verification trust badges.
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                    Refresh Queue
                </Button>
            </div>

            {/* Filters */}
            <Card className="border border-border rounded-xl">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-[200px]"
                    >
                        <option value="all">All Document Types</option>
                        <option value="id_proof">ID Proofs</option>
                        <option value="address_proof">Address Proofs</option>
                        <option value="income_proof">Income Proofs</option>
                        <option value="reference_letter">Reference Letters</option>
                        <option value="other">Others</option>
                    </select>
                </CardContent>
            </Card>

            {/* Error state */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Submissions list */}
            <Card className="border border-border rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <RefreshCw className="h-7 w-7 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground font-medium">Loading verification queue...</p>
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-foreground">No pending submissions</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Verification queue is completely clear.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                        <th className="p-4">User</th>
                                        <th className="p-4">Document Details</th>
                                        <th className="p-4">Uploaded</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredDocs.map((doc) => (
                                        <tr key={doc._id} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-foreground">
                                                    {doc.userId?.name || "Deleted User"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {doc.userId?.email || "N/A"}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground">
                                                        {getDocTypeLabel(doc.type)}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] py-0 font-mono">
                                                        {doc.mimetype}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mt-0.5 max-w-[200px] truncate" title={doc.filename}>
                                                    {doc.filename}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(doc.uploadedAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs rounded-lg"
                                                    onClick={() => handleViewFile(doc._id, doc.filename)}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    View File
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs rounded-lg bg-success hover:bg-success/90 text-white border-0"
                                                    onClick={() => handleApprove(doc._id)}
                                                    disabled={actionLoading}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                    Verify
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 text-xs rounded-lg"
                                                    onClick={() => triggerReject(doc)}
                                                    disabled={actionLoading}
                                                >
                                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                                    Reject
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rejection Dialog feedback form */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive font-bold flex items-center gap-1.5">
                            <XCircle className="w-5 h-5" />
                            Reject Submission
                        </DialogTitle>
                        <DialogDescription className="text-xs pt-1">
                            Provide a brief reason why this document is being rejected (e.g. "Blurred text", "Incorrect name mismatch"). This will be shown to the user on their Document Vault dashboard so they can fix and re-upload.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-2">
                        <textarea
                            placeholder="Type rejection reason here..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRejectSubmit} disabled={actionLoading}>
                            {actionLoading ? "Submitting..." : "Reject & Send Feedback"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
