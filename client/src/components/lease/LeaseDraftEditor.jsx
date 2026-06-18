import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FileText, Calendar, IndianRupee, Shield, 
    Send, Edit, Lock, PenTool, CheckCircle, 
    Download, AlertTriangle, Eye, ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { getToken, getUser } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";
import SignaturePad from "./SignaturePad";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "../ui/dialog";

export default function LeaseDraftEditor({ leaseId }) {
    const navigate = useNavigate();
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [signing, setSigning] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Form states (synced with lease.terms)
    const [rentAmount, setRentAmount] = useState("");
    const [securityDeposit, setSecurityDeposit] = useState("");
    const [leaseStartDate, setLeaseStartDate] = useState("");
    const [leaseEndDate, setLeaseEndDate] = useState("");
    const [noticePeriodDays, setNoticePeriodDays] = useState("30");
    const [additionalClauses, setAdditionalClauses] = useState("");

    // Modal state
    const [sigModalOpen, setSigModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("edit"); // "edit" | "preview" (mobile toggle)

    // Load currentUser
    useEffect(() => {
        const u = getUser();
        if (u) {
            setCurrentUser(u);
        }
    }, []);

    // Fetch lease details
    const fetchLease = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/leases/${leaseId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                const data = json.data;
                setLease(data);
                
                // Initialize form fields
                if (data.terms) {
                    setRentAmount(data.terms.rentAmount || "");
                    setSecurityDeposit(data.terms.securityDeposit || "");
                    
                    // Format dates to YYYY-MM-DD
                    if (data.terms.leaseStartDate) {
                        setLeaseStartDate(new Date(data.terms.leaseStartDate).toISOString().split("T")[0]);
                    }
                    if (data.terms.leaseEndDate) {
                        setLeaseEndDate(new Date(data.terms.leaseEndDate).toISOString().split("T")[0]);
                    }
                    setNoticePeriodDays(data.terms.noticePeriodDays || "30");
                    setAdditionalClauses(data.terms.additionalClauses || "");
                }
            } else {
                showErrorToast(json.message || "Failed to load lease");
            }
        } catch (err) {
            console.error("Fetch lease error:", err);
            showErrorToast("Network error loading lease draft.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leaseId) {
            fetchLease();
        }
    }, [leaseId]);

    // Check permissions
    const isOwner = currentUser && lease && (
        currentUser.id === lease.ownerId?._id || 
        currentUser._id === lease.ownerId?._id ||
        currentUser.id === lease.ownerId || 
        currentUser._id === lease.ownerId
    );

    const isTenant = currentUser && lease && (
        currentUser.id === lease.tenantId?._id || 
        currentUser._id === lease.tenantId?._id ||
        currentUser.id === lease.tenantId || 
        currentUser._id === lease.tenantId
    );

    const isDraft = lease?.status === "draft";
    const canEdit = isOwner && isDraft;

    // Save terms
    const handleSaveTerms = async () => {
        if (!canEdit) return;
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/leases/${leaseId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    terms: {
                        rentAmount: Number(rentAmount),
                        securityDeposit: Number(securityDeposit || 0),
                        leaseStartDate: new Date(leaseStartDate),
                        leaseEndDate: new Date(leaseEndDate),
                        noticePeriodDays: Number(noticePeriodDays),
                        additionalClauses
                    }
                })
            });
            const json = await res.json();
            if (json.success) {
                showSuccessToast("Lease terms saved successfully.");
                setLease(json.data);
            } else {
                showErrorToast(json.message || "Failed to save terms");
            }
        } catch (err) {
            console.error("Save terms error:", err);
            showErrorToast("Network error saving lease terms.");
        } finally {
            setSaving(false);
        }
    };

    // Send lease draft
    const handleSendLease = async () => {
        if (!isOwner || !isDraft) return;
        
        // Confirm first
        if (!window.confirm("Warning: Once you send the lease draft, you will no longer be able to edit its terms. Are you sure you want to lock and send this agreement?")) {
            return;
        }

        setSending(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/leases/${leaseId}/send`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                showSuccessToast("Lease draft locked and sent to tenant.");
                setLease(json.data);
            } else {
                showErrorToast(json.message || "Failed to send lease");
            }
        } catch (err) {
            console.error("Send lease error:", err);
            showErrorToast("Network error locking lease agreement.");
        } finally {
            setSending(false);
        }
    };

    // Save drawn signature
    const handleApplySignature = async (base64Signature) => {
        setSigning(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/leases/${leaseId}/sign`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ signature: base64Signature })
            });
            const json = await res.json();
            if (json.success) {
                showSuccessToast("Your signature has been applied successfully!");
                setLease(json.data);
                setSigModalOpen(false);
            } else {
                showErrorToast(json.message || "Failed to apply signature");
            }
        } catch (err) {
            console.error("Sign lease error:", err);
            showErrorToast("Network error uploading signature.");
        } finally {
            setSigning(false);
        }
    };

    // Download completed PDF
    const handleDownloadPDF = async () => {
        try {
            const token = getToken();
            const res = await fetch(`/api/leases/${leaseId}/pdf`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || "Failed to download PDF");
            }
            
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Signed_Lease_Agreement.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            showSuccessToast("PDF lease downloaded successfully.");
        } catch (err) {
            console.error("PDF download error:", err);
            showErrorToast(err.message || "Failed to download signed PDF");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FileText className="w-8 h-8 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">Loading Lease Agreement...</p>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
                <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-2" />
                <h3 className="font-bold text-foreground">Lease Not Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    The requested lease agreement does not exist or you do not have permission to view it.
                </p>
                <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    // Determine current step on timeline
    const getStatusTimeline = () => {
        const status = lease.status;
        const steps = [
            { label: "Drafting", completed: true, active: status === "draft" },
            { label: "Pending Signatures", completed: status !== "draft", active: status === "sent" },
            { label: "Partially Signed", completed: ["signed_by_owner", "signed_by_tenant", "completed"].includes(status), active: ["signed_by_owner", "signed_by_tenant"].includes(status) },
            { label: "Completed", completed: status === "completed", active: status === "completed" }
        ];
        return steps;
    };

    const timeline = getStatusTimeline();
    
    // Check signature status for current user
    const hasSigned = (isOwner && lease.ownerSignature) || (isTenant && lease.tenantSignature);
    const canSign = lease.status !== "draft" && lease.status !== "completed" && !hasSigned && (isOwner || isTenant);

    return (
        <div className="space-y-6">
            {/* Timeline Progress Tracker */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-soft">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-foreground">
                                Agreement #{lease._id.slice(-6).toUpperCase()}
                            </h2>
                            <Badge variant={lease.status === "completed" ? "success" : "warning"} className="text-xs">
                                {lease.status.replace(/_/g, " ")}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Lease agreement between **{lease.ownerId?.name}** (Owner) and **{lease.tenantId?.name}** (Tenant)
                        </p>
                    </div>

                    {/* PDF Download Button */}
                    {lease.status === "completed" && (
                        <Button
                            className="bg-success hover:bg-success/90 text-white border-0 gap-1.5 h-10 rounded-xl"
                            onClick={handleDownloadPDF}
                        >
                            <Download className="w-4 h-4" />
                            Download Signed PDF
                        </Button>
                    )}

                    {/* Sign Button */}
                    {canSign && (
                        <Button
                            className="bg-primary hover:bg-primary/95 text-white gap-1.5 h-10 rounded-xl font-bold animate-pulse"
                            onClick={() => setSigModalOpen(true)}
                        >
                            <PenTool className="w-4 h-4" />
                            Sign Agreement
                        </Button>
                    )}
                </div>

                {/* Horizontal steps tracker */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between overflow-x-auto gap-4">
                    {timeline.map((step, idx) => (
                        <React.Fragment key={idx}>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    step.completed ? "bg-success text-white" : 
                                    step.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                                }`}>
                                    {step.completed && idx < 3 ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-xs font-semibold ${step.active ? "text-primary" : step.completed ? "text-success" : "text-muted-foreground"}`}>
                                    {step.label}
                                </span>
                            </div>
                            {idx < timeline.length - 1 && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 hidden sm:block" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex lg:hidden bg-muted/65 p-1 rounded-xl border border-border/40 w-fit">
                <button
                    onClick={() => setActiveTab("edit")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        activeTab === "edit" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                    }`}
                >
                    {canEdit ? "Edit Terms" : "View Details"}
                </button>
                <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        activeTab === "preview" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                    }`}
                >
                    Contract Preview
                </button>
            </div>

            {/* Dual Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Left Column: Editor Form or details */}
                <div className={`lg:col-span-2 space-y-4 ${activeTab === "edit" ? "block" : "hidden lg:block"}`}>
                    <Card className="border border-border rounded-xl">
                        <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                                {canEdit ? <Edit className="w-4.5 h-4.5 text-primary" /> : <Lock className="w-4.5 h-4.5 text-muted-foreground" />}
                                Agreement Parameters
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {canEdit ? "Fill lease details. Updates show in real-time on the document preview." : "These parameters are locked and cannot be changed."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-4">
                            
                            {/* Rent Amount */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Monthly Rent (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        disabled={!canEdit}
                                        value={rentAmount}
                                        onChange={(e) => setRentAmount(e.target.value)}
                                        className="pl-7"
                                        placeholder="e.g. 15000"
                                    />
                                </div>
                            </div>

                            {/* Security Deposit */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Security Deposit (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        disabled={!canEdit}
                                        value={securityDeposit}
                                        onChange={(e) => setSecurityDeposit(e.target.value)}
                                        className="pl-7"
                                        placeholder="e.g. 50000"
                                    />
                                </div>
                            </div>

                            {/* Start Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary/70" />
                                    Lease Start Date
                                </label>
                                <Input
                                    type="date"
                                    disabled={!canEdit}
                                    value={leaseStartDate}
                                    onChange={(e) => setLeaseStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary/70" />
                                    Lease End Date
                                </label>
                                <Input
                                    type="date"
                                    disabled={!canEdit}
                                    value={leaseEndDate}
                                    onChange={(e) => setLeaseEndDate(e.target.value)}
                                />
                            </div>

                            {/* Notice Period */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Notice Period (Days)</label>
                                <Input
                                    type="number"
                                    disabled={!canEdit}
                                    value={noticePeriodDays}
                                    onChange={(e) => setNoticePeriodDays(e.target.value)}
                                    placeholder="e.g. 30"
                                />
                            </div>

                            {/* Custom clauses */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Additional Terms & Clauses</label>
                                <Textarea
                                    disabled={!canEdit}
                                    value={additionalClauses}
                                    onChange={(e) => setAdditionalClauses(e.target.value)}
                                    placeholder="Type any custom rent rules, pet policies, maintenance conditions here..."
                                    className="min-h-[120px] text-xs leading-normal"
                                />
                            </div>

                            {/* Save Actions */}
                            {canEdit && (
                                <div className="pt-2 flex flex-col gap-2">
                                    <Button
                                        onClick={handleSaveTerms}
                                        disabled={saving}
                                        className="w-full text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border h-9 rounded-lg"
                                    >
                                        {saving ? "Saving Draft..." : "Save Draft Progress"}
                                    </Button>
                                    
                                    <Button
                                        onClick={handleSendLease}
                                        disabled={sending}
                                        className="w-full text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-9 rounded-lg"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        {sending ? "Sending..." : "Lock & Send to Tenant"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Instructions Banner */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                        <div>
                            <p className="font-bold">E-Signature Legality Notice</p>
                            <p className="mt-1">
                                This digital agreement uses secure hand-drawn digital signatures overlaid on a secure PDF document. Once both parties sign, the draft is sealed and marked completed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Print Preview Sheet */}
                <div className={`lg:col-span-3 space-y-4 ${activeTab === "preview" ? "block" : "hidden lg:block"}`}>
                    <div className="bg-white border border-slate-200 shadow-lg p-6 sm:p-12 text-slate-800 font-serif rounded-xl text-left max-w-2xl mx-auto min-h-[840px] flex flex-col justify-between select-text">
                        <div>
                            {/* Document Title */}
                            <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
                                <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-sans">
                                    Residential Lease Agreement
                                </h2>
                                <p className="text-[10px] text-slate-400 mt-1 italic font-sans">
                                    Drafted online via Renters Platform (ID: {lease._id})
                                </p>
                            </div>

                            {/* Content */}
                            <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700">
                                
                                {/* Section 1 */}
                                <div>
                                    <h4 className="font-sans font-bold text-xs text-slate-900 border-b border-slate-200 pb-1 uppercase">
                                        1. Contract Parties
                                    </h4>
                                    <p className="mt-2">
                                        This agreement is entered into on this date by and between:
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>
                                            <strong>Landlord / Owner:</strong> {lease.ownerId?.name || "N/A"} 
                                            {lease.ownerId?.email && ` (${lease.ownerId.email})`}
                                        </li>
                                        <li>
                                            <strong>Tenant:</strong> {lease.tenantId?.name || "N/A"} 
                                            {lease.tenantId?.email && ` (${lease.tenantId.email})`}
                                        </li>
                                    </ul>
                                </div>

                                {/* Section 2 */}
                                <div>
                                    <h4 className="font-sans font-bold text-xs text-slate-900 border-b border-slate-200 pb-1 uppercase">
                                        2. Premises Description
                                    </h4>
                                    <p className="mt-2">
                                        The landlord agrees to lease the premises located at:
                                    </p>
                                    <p className="mt-1 font-sans font-medium text-slate-800 bg-slate-50 p-2 border border-slate-100 rounded-md">
                                        <strong>{lease.propertyId?.title || "Property Listing"}</strong><br />
                                        {lease.propertyId?.address || "N/A"}, {lease.propertyId?.city || "N/A"}, {lease.propertyId?.state || "N/A"}
                                    </p>
                                </div>

                                {/* Section 3 */}
                                <div>
                                    <h4 className="font-sans font-bold text-xs text-slate-900 border-b border-slate-200 pb-1 uppercase">
                                        3. Terms & Rent Payments
                                    </h4>
                                    <p className="mt-2">
                                        The terms of this lease are agreed upon as follows:
                                    </p>
                                    <table className="w-full mt-2 border border-slate-200 text-left text-xs font-sans">
                                        <tbody>
                                            <tr className="border-b border-slate-200">
                                                <th className="p-2 bg-slate-50 font-bold w-1/3">Monthly Rent</th>
                                                <td className="p-2 font-medium">₹ {rentAmount || "0"} / month</td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <th className="p-2 bg-slate-50 font-bold">Security Deposit</th>
                                                <td className="p-2 font-medium">₹ {securityDeposit || "0"} (Refundable)</td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <th className="p-2 bg-slate-50 font-bold">Start Date</th>
                                                <td className="p-2 font-medium">{leaseStartDate ? new Date(leaseStartDate).toLocaleDateString() : "N/A"}</td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <th className="p-2 bg-slate-50 font-bold">End Date</th>
                                                <td className="p-2 font-medium">{leaseEndDate ? new Date(leaseEndDate).toLocaleDateString() : "N/A"}</td>
                                            </tr>
                                            <tr>
                                                <th className="p-2 bg-slate-50 font-bold">Notice Period</th>
                                                <td className="p-2 font-medium">{noticePeriodDays || "30"} Days</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Section 4 */}
                                <div>
                                    <h4 className="font-sans font-bold text-xs text-slate-900 border-b border-slate-200 pb-1 uppercase">
                                        4. Additional Terms & Conditions
                                    </h4>
                                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-xs">
                                        {additionalClauses || "No additional terms specified."}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Section 5: Signature Blocks */}
                        <div className="mt-12 pt-6 border-t border-slate-200 font-sans">
                            <h4 className="font-bold text-xs text-slate-900 uppercase mb-4">
                                Acknowledgement & Signatures
                            </h4>
                            <div className="grid grid-cols-2 gap-8 text-center text-xs">
                                {/* Owner Sig Block */}
                                <div className="space-y-2 border-t border-slate-200 pt-3 flex flex-col items-center">
                                    <span className="font-bold text-slate-600 block">Landlord / Owner Signature</span>
                                    {lease.ownerSignature ? (
                                        <div className="h-16 flex flex-col items-center justify-center">
                                            <img
                                                src={lease.ownerSignature}
                                                alt="Owner Signature"
                                                className="max-h-12 object-contain"
                                            />
                                            {lease.signedAtOwner && (
                                                <span className="text-[9px] text-slate-400 block mt-1">
                                                    Signed: {new Date(lease.signedAtOwner).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                                            Awaiting Signature
                                        </div>
                                    )}
                                    <span className="font-semibold text-slate-900">{lease.ownerId?.name}</span>
                                </div>

                                {/* Tenant Sig Block */}
                                <div className="space-y-2 border-t border-slate-200 pt-3 flex flex-col items-center">
                                    <span className="font-bold text-slate-600 block">Tenant Signature</span>
                                    {lease.tenantSignature ? (
                                        <div className="h-16 flex flex-col items-center justify-center">
                                            <img
                                                src={lease.tenantSignature}
                                                alt="Tenant Signature"
                                                className="max-h-12 object-contain"
                                            />
                                            {lease.signedAtTenant && (
                                                <span className="text-[9px] text-slate-400 block mt-1">
                                                    Signed: {new Date(lease.signedAtTenant).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                                            Awaiting Signature
                                        </div>
                                    )}
                                    <span className="font-semibold text-slate-900">{lease.tenantId?.name}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Signature Draw Modal/Dialog */}
            <Dialog open={sigModalOpen} onOpenChange={setSigModalOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="font-bold flex items-center gap-1.5">
                            <PenTool className="w-5 h-5 text-primary" />
                            Apply E-Signature
                        </DialogTitle>
                        <DialogDescription className="text-xs pt-1">
                            Use your mouse or touchscreen to draw your signature inside the box below. This will be embedded into the legal document.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <SignaturePad
                            onSave={handleApplySignature}
                            onCancel={() => setSigModalOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
