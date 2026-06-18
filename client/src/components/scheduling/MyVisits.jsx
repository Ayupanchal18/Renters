import React, { useEffect, useState } from "react";
import { Calendar, Clock, User, Mail, Phone, Trash2, AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";

export default function MyVisits() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPast, setShowPast] = useState(false);
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [checkingLease, setCheckingLease] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch("/api/bookings/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setBookings(data.tenant || []);
            } else {
                setError(data.error || "Failed to load bookings");
            }
        } catch (err) {
            console.error("Error fetching tenant bookings:", err);
            setError("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancelClick = (booking) => {
        setCancellingBooking(booking);
    };

    const handleConfirmCancel = async () => {
        if (!cancellingBooking) return;
        setCancelLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/bookings/${cancellingBooking._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: "cancelled" })
            });
            const data = await res.json();
            if (data.success) {
                showSuccessToast("Visit booking cancelled successfully.");
                setCancellingBooking(null);
                fetchBookings();
            } else {
                showErrorToast(data.error || "Failed to cancel booking.");
            }
        } catch (err) {
            console.error("Error cancelling booking:", err);
            showErrorToast("Server error. Please try again.");
        } finally {
            setCancelLoading(false);
        }
    };

    const handleLeaseAction = async (booking) => {
        setCheckingLease(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/leases/property/${booking.propertyId?._id}/tenant/${booking.tenantId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success && json.data) {
                navigate(`/leases/${json.data._id}`);
            } else {
                showErrorToast(
                    "No lease agreement has been drafted by the landlord yet.",
                    "Please contact the landlord/owner to request a lease draft."
                );
            }
        } catch (err) {
            console.error("Lease query error:", err);
            showErrorToast("Failed to retrieve lease status.");
        } finally {
            setCheckingLease(false);
        }
    };

    const formatDateTime = (startStr) => {
        const date = new Date(startStr);
        return {
            dateStr: date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            }),
            timeStr: date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
        };
    };

    // Separate upcoming and past bookings
    const upcomingBookings = bookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed"
    );
    const pastBookings = bookings.filter(
        (b) => b.status === "completed" || b.status === "cancelled"
    );

    if (loading) {
        return (
            <div className="w-full py-12 flex justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading your visits...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-6 text-center bg-card/45 border border-border rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-error mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Error Loading Visits</h4>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchBookings}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-page-enter">
            {/* Upcoming Visits */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground">Upcoming Visits</h3>
                {upcomingBookings.length === 0 ? (
                    <div className="p-8 text-center bg-card/45 border border-dashed border-border rounded-2xl">
                        <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs font-medium text-foreground">No upcoming visits scheduled</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Explore properties and request a visit directly from their pages.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingBookings.map((booking) => {
                            const { dateStr, timeStr } = formatDateTime(booking.slotStart);
                            const property = booking.propertyId || {};
                            const owner = booking.ownerId || {};
                            const thumbnail = property.photos?.[0] || "";

                            return (
                                <div
                                    key={booking._id}
                                    className="bg-card hover-pop border border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                                >
                                    <div className="p-4 flex gap-4">
                                        {/* Property Thumbnail */}
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt={property.title}
                                                className="w-16 h-16 object-cover rounded-xl border border-border/40 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-xl border border-border/40 text-muted-foreground text-[10px] font-semibold flex-shrink-0">
                                                Renters
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-bold text-foreground truncate max-w-[150px]">
                                                    {property.title || "Unknown Property"}
                                                </h4>
                                                <Badge
                                                    variant={booking.status === "confirmed" ? "success" : "warning"}
                                                    size="sm"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                            
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                                                    <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                    {dateStr}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {timeStr}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Owner Contacts & Actions */}
                                    <div className="px-4 py-3 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {owner.avatar ? (
                                                <img
                                                    src={owner.avatar}
                                                    alt={owner.name}
                                                    className="w-7 h-7 rounded-full object-cover border border-border/65 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {owner.name?.[0] || "O"}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate text-foreground leading-tight">{owner.name}</p>
                                                <p className="text-[10px] text-muted-foreground leading-none">Property Owner</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {booking.status === "confirmed" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={checkingLease}
                                                    className="h-8 text-[11px] border-primary/20 hover:border-primary/50 text-primary flex items-center gap-1"
                                                    onClick={() => handleLeaseAction(booking)}
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    Lease
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-[11px] text-error hover:bg-error/5 hover:text-error border-error/20 flex items-center gap-1 flex-shrink-0"
                                                onClick={() => handleCancelClick(booking)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Past Visits (Collapsible) */}
            <div className="border border-border/50 rounded-2xl overflow-hidden bg-card/20">
                <button
                    onClick={() => setShowPast(!showPast)}
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-muted-foreground hover:bg-muted/10 transition-colors"
                >
                    <span>Past & Cancelled Visits ({pastBookings.length})</span>
                    {showPast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showPast && (
                    <div className="p-4 border-t border-border/40 space-y-3">
                        {pastBookings.length === 0 ? (
                            <p className="text-center py-4 text-[11px] text-muted-foreground italic">No past booking records</p>
                        ) : (
                            <div className="space-y-2.5">
                                {pastBookings.map((booking) => {
                                    const { dateStr, timeStr } = formatDateTime(booking.slotStart);
                                    const property = booking.propertyId || {};
                                    
                                    return (
                                        <div
                                            key={booking._id}
                                            className="flex items-center justify-between p-3 bg-muted/10 border border-border/30 rounded-xl text-xs opacity-75"
                                        >
                                            <div className="flex gap-3 items-center min-w-0">
                                                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <h5 className="font-semibold text-foreground truncate max-w-[200px]">
                                                        {property.title || "Property Listing"}
                                                    </h5>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {dateStr} @ {timeStr}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {booking.status === "completed" && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 rounded-lg text-primary hover:bg-primary/5"
                                                        onClick={() => handleLeaseAction(booking)}
                                                        title="View lease agreement"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Badge
                                                    variant={booking.status === "completed" ? "muted" : "destructive"}
                                                    size="sm"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cancellation Confirmation Dialog */}
            {cancellingBooking && (
                <Dialog open={!!cancellingBooking} onOpenChange={() => setCancellingBooking(null)}>
                    <DialogContent className="max-w-md p-6 rounded-2xl">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-error/10 text-error rounded-xl mt-0.5">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Cancel Visit Booking</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Are you sure you want to cancel your visit request for{" "}
                                        <span className="font-semibold text-foreground">
                                            {cancellingBooking.propertyId?.title}
                                        </span>
                                        ? The owner will be notified.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setCancellingBooking(null)}
                                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/95 text-xs font-bold py-2.5 rounded-xl border border-border transition-colors"
                                >
                                    No, Keep Booking
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    disabled={cancelLoading}
                                    className="flex-1 bg-error text-white hover:bg-error/95 disabled:bg-error/50 text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                                >
                                    {cancelLoading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Cancelling...
                                        </>
                                    ) : (
                                        "Yes, Cancel Visit"
                                    )}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
