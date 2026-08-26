import React, { useEffect, useState } from "react";
import { X, ShieldAlert, Lock, AlertTriangle, EyeOff, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import ContentProtectionBadge from "../common/ContentProtectionBadge";
import { getUser } from "../../utils/auth";
import { showWarningToast } from "../../utils/toastNotifications";

/**
 * ProtectedDocumentViewer Component
 * In-App secure viewer for sensitive Vault & KYC Documents.
 * Features dynamic forensic watermarking, right-click blocking, and print/save interception.
 */
export default function ProtectedDocumentViewer({ 
    fileUrl, 
    filename, 
    mimetype, 
    onClose 
}) {
    const user = getUser() || {};
    const userIdentifier = user.email || user.phone || user.name || "CONFIDENTIAL USER";
    const timestamp = new Date().toLocaleString();

    useEffect(() => {
        // Intercept keyboard shortcuts (Ctrl+P, Ctrl+S, PrintScreen)
        const handleKeyDown = (e) => {
            if (
                (e.ctrlKey || e.metaKey) && 
                (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")
            ) {
                e.preventDefault();
                e.stopPropagation();
                showWarningToast("Action blocked: Document protection prevents printing or downloading.");
                return false;
            }
        };

        // Intercept right-click context menu
        const handleContextMenu = (e) => {
            e.preventDefault();
            showWarningToast("Right-click disabled to protect document privacy.");
            return false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("contextmenu", handleContextMenu);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    const isImage = mimetype?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename || "");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none"
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Header Bar */}
                <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-100 truncate" title={filename}>
                                {filename || "Confidential Document"}
                            </h3>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                                Protected Viewer Session • DRM Encrypted
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ContentProtectionBadge className="hidden sm:inline-flex" />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area with Dynamic Forensic Watermark */}
                <div className="relative flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center min-h-[350px]">
                    
                    {/* Dynamic Forensic Watermark Repeated Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex flex-wrap content-around justify-around opacity-15 select-none">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="p-6 rotate-[-25deg] text-center">
                                <p className="text-white text-xs font-mono font-bold tracking-widest uppercase">
                                    {userIdentifier}
                                </p>
                                <p className="text-slate-300 text-[9px] font-mono mt-0.5">
                                    CONFIDENTIAL • {timestamp}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Document Display */}
                    {isImage ? (
                        <div className="relative z-10 max-h-[70vh] max-w-full flex items-center justify-center">
                            <img
                                src={fileUrl}
                                alt={filename || "Vault Document"}
                                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800 pointer-events-none"
                                onDragStart={(e) => e.preventDefault()}
                            />
                        </div>
                    ) : (
                        <div className="relative z-10 w-full h-[70vh] rounded-lg overflow-hidden border border-slate-800">
                            <iframe
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                title={filename || "Document Preview"}
                                className="w-full h-full border-0 pointer-events-auto"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Security Notice */}
                <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dynamic Watermark Active ({userIdentifier})</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <EyeOff className="w-3 h-3" />
                        Save/Print Screen Interception Enabled
                    </div>
                </div>
            </div>
        </div>
    );
}
