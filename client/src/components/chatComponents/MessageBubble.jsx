import { useState } from "react";
import { Clock, Download, FileText, Image as ImageIcon, Calendar } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { getToken } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";

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

    const formatFileSize = (bytes) => {
        if (!bytes) return "";
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Use timestamp or createdAt field
    const messageTime = message.timestamp || message.createdAt;
    
    // Check if message has file attachment
    const hasFile = message.image || message.file || message.attachment;
    const isImageFile = message.image || (message.file && message.file.type?.startsWith('image/'));

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
            <div className="flex justify-center w-full my-2 animate-fade-in">
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
            <div className={cn("flex w-full mb-2 animate-fade-in", isOwn ? "justify-end" : "justify-start")}>
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
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 w-full`}>
            <div
                className={`max-w-[80%] sm:max-w-[75%] lg:max-w-md px-3 py-1.5 rounded-2xl overflow-hidden ${
                    isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card text-foreground border border-border rounded-bl-sm"
                } ${isPending ? "opacity-70" : ""}`}
            >
                {/* Image attachment */}
                {message.image && (
                    <div className="mb-2">
                        <img
                            src={message.image}
                            alt="Message attachment"
                            className="w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.image, '_blank')}
                        />
                    </div>
                )}

                {/* Non-image file attachment */}
                {message.file && !isImageFile && (
                    <div className="mb-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                {message.file.type?.includes('pdf') ? (
                                    <FileText className="w-8 h-8 text-red-500" />
                                ) : (
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {message.file.name || 'File attachment'}
                                </p>
                                {message.file.size && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(message.file.size)}
                                    </p>
                                )}
                            </div>
                            {message.file.url && (
                                <button
                                    onClick={() => window.open(message.file.url, '_blank')}
                                    className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                                    title="Download file"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Message text */}
                {message.text && <p className="break-words text-sm whitespace-pre-wrap overflow-wrap-anywhere">{message.text}</p>}

                {/* Timestamp and status */}
                <div className={`flex items-center gap-1 mt-0.5 ${
                    isOwn ? "justify-end" : "justify-start"
                }`}>
                    {isPending && (
                        <Clock className={`w-3 h-3 ${
                            isOwn ? "text-primary-foreground/50" : "text-muted-foreground/50"
                        }`} />
                    )}
                    <p
                        className={`text-xs ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                    >
                        {isPending ? "Sending..." : formatTime(messageTime)}
                    </p>
                </div>
            </div>
        </div>
    );
}
