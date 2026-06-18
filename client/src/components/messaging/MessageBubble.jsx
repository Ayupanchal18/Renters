import { useState } from "react";
import { Clock, Download, FileText, Check, CheckCheck, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PropertyShareCard } from "./PropertyShareCard";
import { cn } from "../../lib/utils";
import { getToken } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";

// Helper to format file size
function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Regex to capture property links
const PROPERTY_URL_REGEX = /(?:https?:\/\/[^\s/]+)?\/(rent|buy|properties|property)\/([a-zA-Z0-9_-]+)/g;

export function MessageBubble({ message, isOwn, isPending = false }) {
    const [bookingStatus, setBookingStatus] = useState(message.booking?.status);
    const [actionLoading, setActionLoading] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/bookings/${message.booking.bookingId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setBookingStatus(newStatus);
                showSuccessToast(`Visit booking ${newStatus === "confirmed" ? "confirmed" : "declined"}!`);
            } else {
                showErrorToast(data.error || "Failed to update status.");
            }
        } catch (err) {
            console.error("Error updating booking status:", err);
            showErrorToast("Error updating booking status.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatBookingDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatBookingTime = (startStr, endStr) => {
        if (!startStr || !endStr) return "";
        const startTime = new Date(startStr).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
        const endTime = new Date(endStr).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
        return `${startTime} - ${endTime}`;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const messageTime = message.timestamp || message.createdAt;
    
    // Detect attachments in different shapes
    const hasImage = message.image || message.attachment?.mimeType?.startsWith("image/") || message.file?.type?.startsWith("image/");
    const imageUrl = message.image || message.attachment?.url || message.file?.url;
    
    const hasDoc = (message.attachment && !message.attachment.mimeType?.startsWith("image/")) || 
                    (message.file && !message.file.type?.startsWith("image/"));
    const docData = message.attachment 
        ? {
            name: message.attachment.filename || "Attachment",
            size: message.attachment.size,
            url: message.attachment.url,
            isPdf: message.attachment.mimeType?.includes("pdf"),
          }
        : message.file 
            ? {
                name: message.file.name || "Attachment",
                size: message.file.size,
                url: message.file.url,
                isPdf: message.file.type?.includes("pdf") || message.file.name?.endsWith(".pdf"),
              }
            : null;

    // Check if the plain text has property links
    const matches = message.text ? [...message.text.matchAll(PROPERTY_URL_REGEX)] : [];

    // CUSTOM RENDERING FOR BOOKING MESSAGES
    if (message.type === "booking_update" || message.type === "system") {
        const isUpdate = message.type === "booking_update";
        const booking = message.booking;
        
        let pillColor = "bg-muted text-muted-foreground border-border/50";
        if (isUpdate && booking) {
            const currentStat = bookingStatus || booking.status;
            if (currentStat === "confirmed") {
                pillColor = "bg-success/10 text-success border-success/20";
            } else if (currentStat === "cancelled") {
                pillColor = "bg-error/10 text-error border-error/20";
            } else if (currentStat === "completed") {
                pillColor = "bg-primary/10 text-primary border-primary/20";
            }
        }

        return (
            <div className="flex justify-center w-full my-2.5 animate-fade-in">
                <div className={cn("px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 shadow-sm", pillColor)}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{message.text}</span>
                </div>
            </div>
        );
    }

    if (message.type === "booking_request" && message.booking) {
        const booking = message.booking;
        const thumbnail = booking.propertyThumbnail;
        const title = booking.propertyTitle;
        const dateStr = formatBookingDate(booking.slotStart);
        const timeStr = formatBookingTime(booking.slotStart, booking.slotEnd);

        return (
            <div className={cn("flex w-full mb-2.5 animate-fade-in", isOwn ? "justify-end" : "justify-start")}>
                <div
                    className={cn(
                        "w-full max-w-xs sm:max-w-sm rounded-2xl border flex flex-col overflow-hidden shadow-md",
                        isOwn
                            ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                            : "bg-card text-foreground border-border rounded-tl-none"
                    )}
                >
                    {/* Property Header */}
                    <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-border/40">
                        {thumbnail ? (
                            <img
                                src={thumbnail}
                                alt={title}
                                className="w-12 h-12 object-cover rounded-lg border border-border/50 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground text-xs font-semibold flex-shrink-0">
                                Renters
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">Visit Request</p>
                            <h4 className="text-xs font-bold truncate">{title}</h4>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-3.5 space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs">
                                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="font-semibold">{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="font-semibold">{timeStr}</span>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className={cn(
                                "p-2 rounded-xl text-[11px] leading-relaxed border",
                                isOwn ? "bg-white/10 border-white/20 text-primary-foreground/90" : "bg-muted border-border/60 text-muted-foreground"
                            )}>
                                <span className="font-semibold block mb-0.5 text-[9px] uppercase tracking-wider opacity-75">Tenant Note:</span>
                                {booking.notes}
                            </div>
                        )}

                        {/* Status / Actions */}
                        <div className="flex flex-col gap-2 pt-1">
                            {bookingStatus === "pending" ? (
                                !isOwn ? (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="flex-1 text-xs bg-success text-white border border-success/80 hover:bg-success/90"
                                            disabled={actionLoading}
                                            onClick={() => handleStatusUpdate("confirmed")}
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-xs text-error border-error/50 hover:bg-error/5 hover:text-error"
                                            disabled={actionLoading}
                                            onClick={() => handleStatusUpdate("cancelled")}
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="opacity-75">Status:</span>
                                        <Badge variant="warning">Pending Approval</Badge>
                                    </div>
                                )
                            ) : (
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="opacity-75">Status:</span>
                                    <Badge
                                        variant={
                                            bookingStatus === "confirmed"
                                                ? "success"
                                                : bookingStatus === "completed"
                                                ? "default"
                                                : "destructive"
                                        }
                                    >
                                        {bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timestamp footer */}
                    <div className={cn(
                        "px-3 py-1.5 flex justify-end text-[9px] border-t border-border/10",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                        {new Date(messageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex w-full mb-2", isOwn ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[85%] sm:max-w-[70%] lg:max-w-md px-3.5 py-2 rounded-2xl flex flex-col gap-1 shadow-sm",
                    isOwn
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card text-foreground border border-border rounded-tl-none",
                    isPending && "opacity-70 animate-pulse"
                )}
            >
                {/* Image attachment rendering */}
                {hasImage && imageUrl && (
                    <div className="mb-1 rounded-lg overflow-hidden border border-border/50 max-w-full">
                        <Dialog>
                            <DialogTrigger asChild>
                                <img
                                    src={imageUrl}
                                    alt="Chat attachment"
                                    className="w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                />
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-black/90 flex items-center justify-center rounded-xl">
                                <img
                                    src={imageUrl}
                                    alt="Enlarged attachment"
                                    className="max-w-full max-h-[80vh] object-contain"
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* Non-image document attachment rendering */}
                {hasDoc && docData && (
                    <div className={cn(
                        "mb-1 p-2.5 rounded-lg border flex items-center gap-3",
                        isOwn 
                            ? "bg-white/10 border-white/20 text-primary-foreground" 
                            : "bg-muted border-border text-foreground"
                    )}>
                        <FileText className={cn("w-8 h-8 flex-shrink-0", docData.isPdf ? "text-rose-500" : "text-muted-foreground")} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{docData.name}</p>
                            {docData.size && (
                                <p className={cn("text-[10px]", isOwn ? "text-primary-foreground/75" : "text-muted-foreground")}>
                                    {formatFileSize(docData.size)}
                                </p>
                            )}
                        </div>
                        {docData.url && (
                            <a
                                href={docData.url}
                                download={docData.name}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isOwn ? "hover:bg-white/10" : "hover:bg-muted-foreground/15"
                                )}
                                title="Download file"
                            >
                                <Download className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                )}

                {/* Plain text display */}
                {message.text && (
                    <p className="break-words text-[13px] leading-relaxed whitespace-pre-wrap">
                        {message.text}
                    </p>
                )}

                {/* Property link embeds */}
                {matches.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                        {matches.map((match, idx) => {
                            const [fullUrl, type, slug] = match;
                            return (
                                <PropertyShareCard
                                    key={idx}
                                    slug={slug}
                                    type={type}
                                    originalLink={fullUrl}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Timestamp and Read status receipt dot */}
                <div className={cn(
                    "flex items-center gap-1 mt-0.5 self-end text-[10px]",
                    isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
                )}>
                    <span>
                        {isPending ? "Sending..." : formatTime(messageTime)}
                    </span>
                    
                    {isOwn && !isPending && (
                        <span>
                            {message.read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-primary-foreground" />
                            ) : (
                                <Check className="w-3.5 h-3.5 opacity-80 text-primary-foreground/70" />
                            )}
                        </span>
                    )}
                    {isOwn && isPending && (
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                    )}
                </div>
            </div>
        </div>
    );
}
