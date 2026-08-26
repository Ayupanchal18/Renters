import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
    UploadCloud, FileText, CheckCircle, AlertCircle, 
    XCircle, Trash2, Eye, Info, RefreshCw, ShieldAlert, Sparkles 
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { getToken } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";
import ProtectedDocumentViewer from "./ProtectedDocumentViewer";
import ContentProtectionBadge from "../common/ContentProtectionBadge";

const DOCUMENT_TYPES = [
    { key: "id_proof", label: "Identity Proof", desc: "Passport, Driver's License, or National ID card", required: true },
    { key: "address_proof", label: "Address Proof", desc: "Utility Bill, Bank Statement, or Rental Agreement", required: true },
    { key: "income_proof", label: "Income Proof", desc: "Pay slips, Tax Returns, or employment letter", required: false },
    { key: "reference_letter", label: "Reference Letter", desc: "Recommendation from past landlord or manager", required: false },
    { key: "other", label: "Other Documents", desc: "Any additional supporting documents", required: false }
];

export default function DocumentVault({ onStatusChange }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState({}); // type -> boolean
    const [uploadProgress, setUploadProgress] = useState({}); // type -> number
    const [deleting, setDeleting] = useState({}); // docId -> boolean
    const [viewingDoc, setViewingDoc] = useState(null); // { url, filename, mimetype }
    const fileInputs = useRef({});

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch("/api/vault/documents", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                setDocuments(json.data);
                // Trigger parent updates
                onStatusChange?.(json.data);
            } else {
                showErrorToast(json.message || "Failed to load vault documents");
            }
        } catch (err) {
            console.error("Fetch documents error:", err);
            showErrorToast("Network error loading document vault.");
        } finally {
            setLoading(false);
        }
    }, [onStatusChange]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Handle file upload
    const handleUpload = async (type, file) => {
        if (!file) return;

        // Size check (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showErrorToast("File size exceeds 10MB limit.");
            return;
        }

        // Mimetype check
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            showErrorToast("Supported file types are JPEG, PNG, and PDF.");
            return;
        }

        setUploading(prev => ({ ...prev, [type]: true }));
        setUploadProgress(prev => ({ ...prev, [type]: 10 }));

        try {
            const token = getToken();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);

            // Fetch with progress is done via XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/vault/documents");
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(prev => ({ ...prev, [type]: percent }));
                }
            };

            xhr.onload = async () => {
                setUploading(prev => ({ ...prev, [type]: false }));
                const response = JSON.parse(xhr.responseText);
                if (xhr.status === 201 && response.success) {
                    showSuccessToast(`${file.name} uploaded successfully and is pending review.`);
                    fetchDocuments();
                } else {
                    showErrorToast(response.message || "Upload failed");
                }
            };

            xhr.onerror = () => {
                setUploading(prev => ({ ...prev, [type]: false }));
                showErrorToast("Network upload error.");
            };

            xhr.send(formData);
        } catch (err) {
            console.error("Upload error:", err);
            setUploading(prev => ({ ...prev, [type]: false }));
            showErrorToast("Failed to initiate document upload.");
        }
    };

    // Handle delete document
    const handleDelete = async (docId, type) => {
        if (!window.confirm("Are you sure you want to delete this document from your vault?")) {
            return;
        }

        setDeleting(prev => ({ ...prev, [docId]: true }));
        try {
            const token = getToken();
            const res = await fetch(`/api/vault/documents/${docId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                showSuccessToast("Document deleted successfully.");
                fetchDocuments();
            } else {
                showErrorToast(json.message || "Failed to delete document");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showErrorToast("Failed to delete document.");
        } finally {
            setDeleting(prev => ({ ...prev, [docId]: false }));
        }
    };

    // Handle view document proxy
    const handleView = async (docId, filename) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/vault/documents/${docId}/file`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Could not fetch file preview.");
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            setViewingDoc({
                url: blobUrl,
                filename: filename || "Vault Document",
                mimetype: res.headers.get("content-type") || ""
            });
        } catch (err) {
            showErrorToast(err.message || "Failed to view document");
        }
    };

    // Delete my data privacy affordance
    const handleDeleteAllData = async () => {
        const confirmMsg = "Warning: This will delete ALL non-verified documents from your secure vault. Verified documents cannot be deleted while they are active. Do you wish to proceed?";
        if (!window.confirm(confirmMsg)) return;

        // Collect non-verified documents
        const deletableDocs = documents.filter(d => d.status !== "verified");
        if (deletableDocs.length === 0) {
            showSuccessToast("No deletable documents found in your vault.");
            return;
        }

        try {
            const token = getToken();
            let successCount = 0;
            for (const doc of deletableDocs) {
                const res = await fetch(`/api/vault/documents/${doc._id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const json = await res.json();
                if (json.success) successCount++;
            }

            showSuccessToast(`Successfully deleted ${successCount} documents from your vault.`);
            fetchDocuments();
        } catch (err) {
            console.error("Delete all data error:", err);
            showErrorToast("Failed to complete data deletion.");
        }
    };

    // Match loaded documents to categories
    const getDocForType = (type) => {
        return documents.find(doc => doc.type === type);
    };

    // Calculate verification checklist progress
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
    const verifiedCount = requiredDocs.filter(reqType => {
        const doc = getDocForType(reqType.key);
        return doc && doc.status === "verified";
    }).length;

    const isFullyVerified = verifiedCount === requiredDocs.length;

    return (
        <Card className="border border-border rounded-xl shadow-soft">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-primary" />
                            Personal Document Vault
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Keep your identity and credentials secure. Upload documents to gain verified owner badges.
                        </CardDescription>
                    </div>

                    {/* Verification Progress Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {isFullyVerified ? (
                            <div className="flex items-center gap-1.5 bg-success/15 border border-success/30 px-3 py-1 rounded-xl text-xs font-bold text-success">
                                <CheckCircle className="w-4 h-4" />
                                Verified Profile
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-500">
                                <Info className="w-4 h-4" />
                                {verifiedCount} of {requiredDocs.length} required verified
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Info trust banner */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3.5 items-start">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-foreground">Why verify your profile?</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Verified users get a trust checkmark badge next to their name on properties and messages. Verified listings get up to **2.5x more views** and bookings from serious renters.
                        </p>
                    </div>
                </div>

                {/* Upload Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOCUMENT_TYPES.map((typeObj) => {
                        const existingDoc = getDocForType(typeObj.key);
                        const isUp = uploading[typeObj.key];

                        return (
                            <div 
                                key={typeObj.key}
                                className={`border border-border/80 rounded-xl p-4 flex flex-col justify-between h-[180px] bg-card hover:shadow-soft transition-all`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            {typeObj.label}
                                            {typeObj.required && (
                                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.25 rounded-md">
                                                    Required
                                                </span>
                                            )}
                                        </h4>

                                        {/* Status indicator */}
                                        {existingDoc && (
                                            <Badge 
                                                variant={
                                                    existingDoc.status === "verified" ? "success" : 
                                                    existingDoc.status === "rejected" ? "destructive" : "warning"
                                                }
                                                className="text-[9px] px-2 py-0.5 rounded-full capitalize"
                                                title={existingDoc.status === "rejected" ? `Reason: ${existingDoc.rejectionReason}` : ""}
                                            >
                                                {existingDoc.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-normal mt-1 min-h-[30px] line-clamp-2">
                                        {typeObj.desc}
                                    </p>
                                </div>

                                <div className="mt-4 border-t border-border/20 pt-3 flex items-center justify-between">
                                    {existingDoc ? (
                                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                                            <span className="text-[10px] font-mono text-muted-foreground truncate" title={existingDoc.filename}>
                                                {existingDoc.filename}
                                            </span>
                                            {existingDoc.status === "rejected" && existingDoc.rejectionReason && (
                                                <span className="text-[9px] text-destructive font-medium line-clamp-1 mt-0.5" title={existingDoc.rejectionReason}>
                                                    Reason: {existingDoc.rejectionReason}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/60 italic">
                                            No file uploaded
                                        </span>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {existingDoc && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleView(existingDoc._id, existingDoc.filename)}
                                                    title="View uploaded document"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={existingDoc.status === "verified" || deleting[existingDoc._id]}
                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-30"
                                                    onClick={() => handleDelete(existingDoc._id, typeObj.key)}
                                                    title={existingDoc.status === "verified" ? "Verified documents cannot be deleted" : "Delete document"}
                                                >
                                                    {deleting[existingDoc._id] ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </>
                                        )}

                                        {/* Upload trigger */}
                                        <input
                                            type="file"
                                            ref={el => fileInputs.current[typeObj.key] = el}
                                            className="hidden"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={(e) => handleUpload(typeObj.key, e.target.files[0])}
                                        />

                                        {(!existingDoc || existingDoc.status === "rejected") && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isUp}
                                                className="text-xs h-8 rounded-lg border-primary/20 hover:border-primary/50 text-primary"
                                                onClick={() => fileInputs.current[typeObj.key]?.click()}
                                            >
                                                {isUp ? (
                                                    <div className="flex items-center gap-1">
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                        <span>{uploadProgress[typeObj.key] || 10}%</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <UploadCloud className="w-3.5 h-3.5" />
                                                        <span>Upload</span>
                                                    </div>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Privacy affordances */}
                <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-muted-foreground leading-normal max-w-md">
                        * Documents are stored in a private, encrypted environment. Non-verified documents can be deleted at any time. Verified documents must remain active for compliance.
                    </p>
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-destructive self-end sm:self-auto h-8 rounded-lg"
                        onClick={handleDeleteAllData}
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Non-Verified Data
                    </Button>
                </div>

                {/* Protected In-App Document Viewer Modal */}
                {viewingDoc && (
                    <ProtectedDocumentViewer
                        fileUrl={viewingDoc.url}
                        filename={viewingDoc.filename}
                        mimetype={viewingDoc.mimetype}
                        onClose={() => setViewingDoc(null)}
                    />
                )}
            </CardContent>
        </Card>
    );
}
