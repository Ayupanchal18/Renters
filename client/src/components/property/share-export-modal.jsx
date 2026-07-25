import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
    X, Printer, Copy, Check, Share2, Mail, MessageCircle, 
    Send, ExternalLink, FileText, QrCode, Sparkles
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

/**
 * ShareExportModal Component
 * Interactive dialog allowing users to:
 * 1. Print property brochure sheet or export to PDF directly (window.print())
 * 2. Copy property link to clipboard
 * 3. Share to WhatsApp, Email, Twitter/X, LinkedIn
 * 4. Trigger Native Web Share sheet on mobile devices
 */
export default function ShareExportModal({ isOpen, onClose, property }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !property) return null;

    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const isRent = property.listingType === "rent" || property.monthlyRent !== undefined;
    const priceDisplay = isRent
        ? `₹${new Intl.NumberFormat("en-IN").format(property.monthlyRent || 0)}/mo`
        : `₹${new Intl.NumberFormat("en-IN").format(property.price || 0)}`;

    const shareText = `Check out this property on Renters: ${property.title || "Property Listing"} (${priceDisplay}) in ${property.city || "India"}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const handlePrint = () => {
        onClose(); // Close modal immediately so it does not block print view
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: property.title || "Property Listing",
                    text: shareText,
                    url: currentUrl,
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    handleCopyLink();
                }
            }
        } else {
            handleCopyLink();
        }
    };

    const shareTargets = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
            action: () => {
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`;
                window.open(url, "_blank", "noopener,noreferrer");
            }
        },
        {
            name: "Email",
            icon: Mail,
            color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20",
            action: () => {
                const url = `mailto:?subject=${encodeURIComponent(`Property Interest: ${property.title}`)}&body=${encodeURIComponent(`${shareText}\n\nLink: ${currentUrl}`)}`;
                window.open(url, "_blank");
            }
        },
        {
            name: "Telegram",
            icon: Send,
            color: "bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 border-sky-500/20",
            action: () => {
                const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
                window.open(url, "_blank", "noopener,noreferrer");
            }
        },
        {
            name: "Twitter / X",
            icon: ExternalLink,
            color: "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20",
            action: () => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
                window.open(url, "_blank", "noopener,noreferrer");
            }
        }
    ];

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 print:hidden no-print"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Share & Export Property</h2>
                            <p className="text-xs text-muted-foreground line-clamp-1">{property.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Primary Print / PDF Feature Section */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-md">
                                <Printer className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-foreground">Print Property Sheet</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/20 text-primary rounded-full">PDF / Print</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Export a vector-sharp 1-page printable brochure with QR code, specs, and owner info.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handlePrint}
                            className="h-10 px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex-shrink-0 gap-1.5"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print / PDF</span>
                        </Button>
                    </div>

                    {/* Social Share Grid */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
                            Direct Share
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {shareTargets.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.action}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all hover:scale-[1.02] active:scale-95 ${item.color}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Web Native Share (Mobile) */}
                    {typeof navigator !== "undefined" && navigator.share && (
                        <Button
                            onClick={handleNativeShare}
                            variant="outline"
                            className="w-full h-11 text-xs font-semibold rounded-xl border-border hover:bg-muted gap-2"
                        >
                            <Share2 className="w-4 h-4 text-primary" />
                            <span>Open Device Share Menu</span>
                        </Button>
                    )}

                    {/* Copy Link Input Bar */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                            Property Page URL
                        </label>
                        <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-xl border border-border">
                            <input
                                type="text"
                                readOnly
                                value={currentUrl}
                                className="flex-1 bg-transparent px-3 text-xs text-muted-foreground focus:outline-none truncate"
                            />
                            <Button
                                size="sm"
                                onClick={handleCopyLink}
                                className={`h-9 px-4 text-xs rounded-lg transition-all gap-1.5 ${
                                    copied 
                                        ? "bg-emerald-600 text-white" 
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-primary" />
                        Includes Scannable Listing QR Code
                    </span>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs px-3">
                        Close
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
