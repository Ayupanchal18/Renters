import React, { useState, useEffect, useMemo, useRef } from "react";
import { Calendar, Clock, ChevronRight, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, getToken } from "../../utils/auth";
import { Dialog, DialogContent } from "../ui/dialog";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";

export default function BookingWidget({ propertyId, ownerId, propertyTitle }) {
    const navigate = useNavigate();
    const location = useLocation();

    // State management
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDateStr, setSelectedDateStr] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch availability
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/properties/${propertyId}/availability?days=14`);
                const data = await res.json();
                if (data.success) {
                    setSlots(data.slots || []);
                } else {
                    setError(data.error || "Failed to load availability");
                }
            } catch (err) {
                console.error("Error fetching availability:", err);
                setError("Network error occurred.");
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) {
            fetchAvailability();
        }
    }, [propertyId]);

    // Group computed slots by date for easy parsing
    const groupedSlots = useMemo(() => {
        const groups = {};
        slots.forEach(slot => {
            const dateStr = new Date(slot.slotStart).toISOString().split("T")[0];
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(slot);
        });
        return groups;
    }, [slots]);

    // Generate next 14 days list starting from today
    const next14Days = useMemo(() => {
        const days = [];
        const start = new Date();
        for (let i = 0; i < 14; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const dateStr = current.toISOString().split("T")[0];
            const hasSlots = !!groupedSlots[dateStr] && groupedSlots[dateStr].length > 0;
            days.push({
                dateStr,
                dayLabel: current.toLocaleDateString("en-US", { weekday: "short" }),
                dayNum: current.getDate(),
                monthLabel: current.toLocaleDateString("en-US", { month: "short" }),
                hasSlots
            });
        }
        return days;
    }, [groupedSlots]);

    // Set first available date as selected default
    useEffect(() => {
        if (next14Days.length > 0 && !selectedDateStr) {
            const firstAvailable = next14Days.find(d => d.hasSlots);
            if (firstAvailable) {
                setSelectedDateStr(firstAvailable.dateStr);
            } else {
                setSelectedDateStr(next14Days[0].dateStr);
            }
        }
    }, [next14Days, selectedDateStr]);

    const activeSlots = useMemo(() => {
        return groupedSlots[selectedDateStr] || [];
    }, [groupedSlots, selectedDateStr]);

    const handleSlotClick = (slot) => {
        if (!isAuthenticated()) {
            // Redirect to login with return path
            const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
            navigate(`/login?returnTo=${returnUrl}`);
            return;
        }
        setSelectedSlot(slot);
        setIsDialogOpen(true);
    };

    const handleConfirmBooking = async () => {
        if (!selectedSlot) return;
        setBookingLoading(true);
        const token = getToken();

        try {
            const res = await fetch(`/api/properties/${propertyId}/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    slotStart: selectedSlot.slotStart,
                    slotEnd: selectedSlot.slotEnd,
                    notes
                })
            });

            const data = await res.json();
            if (data.success) {
                setBookingSuccess(selectedSlot);
                setIsDialogOpen(false);
                showSuccessToast("Visit requested successfully!");
            } else {
                showErrorToast(data.error || "Failed to request visit.");
            }
        } catch (err) {
            console.error("Booking error:", err);
            showErrorToast("Server error. Please try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    // If zero availability setup at all
    const hasAnyAvailability = useMemo(() => {
        return slots.length > 0;
    }, [slots]);

    if (loading) {
        return (
            <div className="w-full bg-card/40 backdrop-blur-md border border-border/60 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="h-4 bg-muted-foreground/15 rounded-md w-1/3 skeleton-wave" />
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-12 h-16 bg-muted-foreground/10 rounded-xl flex-shrink-0 skeleton-wave" />
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-9 bg-muted-foreground/10 rounded-lg skeleton-wave" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !hasAnyAvailability) {
        return (
            <div className="w-full bg-card/50 border border-border/50 rounded-2xl p-5 text-center space-y-3.5">
                <AlertCircle className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <div>
                    <h4 className="text-sm font-semibold text-foreground">Schedule a Visit</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        No active scheduling rules set by the owner. You can contact them directly in chat to set up a walkthrough.
                    </p>
                </div>
                {isAuthenticated() ? (
                    <button
                        onClick={() => navigate("/messages")}
                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold rounded-xl transition-all active:scale-98 shadow-sm"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message Owner
                    </button>
                ) : (
                    <button
                        onClick={() => navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`)}
                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold rounded-xl transition-all active:scale-98 shadow-sm"
                    >
                        Login to Message
                    </button>
                )}
            </div>
        );
    }

    if (bookingSuccess) {
        const formattedDate = new Date(bookingSuccess.slotStart).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        return (
            <div className="w-full bg-card/60 backdrop-blur-lg border border-success/20 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-base">Visit Requested!</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        We have submitted your request for <span className="font-semibold text-foreground">{formattedDate}</span>.
                    </p>
                    <p className="text-[11px] text-primary/90 mt-2 font-medium">
                        You will be notified as soon as the owner confirms.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-bold py-2 rounded-lg transition-colors border border-border"
                >
                    View My Visits
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-card/50 border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Schedule a Visit
            </h4>

            {/* Horizontal Scrollable Date Picker */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Select Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-1 px-1">
                    {next14Days.map((day) => {
                        const isSelected = selectedDateStr === day.dateStr;
                        const fullDateName = new Date(day.dateStr).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                        });
                        const statusLabel = day.hasSlots ? "available" : "no slots available";

                        return (
                            <button
                                type="button"
                                key={day.dateStr}
                                onClick={() => setSelectedDateStr(day.dateStr)}
                                aria-label={`${fullDateName} — ${statusLabel}`}
                                aria-pressed={isSelected}
                                disabled={!day.hasSlots}
                                className={`flex flex-col items-center justify-center w-12 py-2 px-1 rounded-xl border flex-shrink-0 snap-center transition-all ${
                                    isSelected
                                        ? "border-primary bg-primary/10 text-primary font-bold shadow-inner font-bold"
                                        : day.hasSlots
                                            ? "border-border/60 bg-background/50 text-foreground hover:border-primary/50"
                                            : "border-border/20 bg-muted/20 text-muted-foreground opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <span className="text-[9px] uppercase tracking-wide opacity-80">{day.dayLabel}</span>
                                <span className="text-xs font-semibold my-0.5">{day.dayNum}</span>
                                <span className="text-[8px] opacity-75">{day.monthLabel}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Available Time Slots Grid */}
            <div className="space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground">Select Available Time</label>
                {activeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {activeSlots.map((slot, idx) => {
                            const timeString = new Date(slot.slotStart).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                            });

                            const dateLabel = new Date(slot.slotStart).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric"
                            });

                            return (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => handleSlotClick(slot)}
                                    aria-label={`${dateLabel} at ${timeString} — available slot`}
                                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-background border border-border/80 hover:border-primary rounded-xl text-[11px] font-semibold text-foreground transition-all hover:bg-primary/5 hover:text-primary active:scale-97 shadow-sm"
                                >
                                    <Clock className="w-3.5 h-3.5 opacity-80" />
                                    {timeString}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-muted/20 rounded-xl border border-border/40">
                        <p className="text-[11px] text-muted-foreground italic">No time slots available for this day</p>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog Overlay */}
            {selectedSlot && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md p-6 rounded-2xl">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Confirm Visit Request
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    For property: <span className="font-semibold text-foreground">{propertyTitle}</span>
                                </p>
                            </div>

                            {/* Summary block */}
                            <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-bold text-foreground">
                                        {new Date(selectedSlot.slotStart).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time Slot:</span>
                                    <span className="font-bold text-primary">
                                        {new Date(selectedSlot.slotStart).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true
                                        })}
                                        {" - "}
                                        {new Date(selectedSlot.slotEnd).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Tenant notes */}
                            <div className="space-y-1.5">
                                <label htmlFor="booking-notes" className="text-[11px] font-semibold text-foreground">
                                    Add a message for the owner (optional)
                                </label>
                                <textarea
                                    id="booking-notes"
                                    placeholder="Tell the owner why you are visiting, e.g., 'Looking for a PG for immediate move-in...'"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                                />
                            </div>

                            {/* CTAs */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/95 text-xs font-bold py-2.5 rounded-xl border border-border transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={bookingLoading}
                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/50 text-xs font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                    {bookingLoading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                            Requesting...
                                        </>
                                    ) : (
                                        <>
                                            Request Visit
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </>
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
