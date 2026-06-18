import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, User, Mail, Phone, Check, X, AlertCircle, Info, ChevronRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";

export default function IncomingVisits() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
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
                setBookings(data.owner || []);
            } else {
                setError(data.error || "Failed to load bookings");
            }
        } catch (err) {
            console.error("Error fetching owner bookings:", err);
            setError("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleAction = async (bookingId, newStatus) => {
        setActionLoadingId(bookingId);
        try {
            const token = getToken();
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                showSuccessToast(`Booking request ${newStatus === "confirmed" ? "approved" : "declined"} successfully.`);
                fetchBookings();
            } else {
                showErrorToast(data.error || "Failed to update booking status.");
            }
        } catch (err) {
            console.error("Error updating booking status:", err);
            showErrorToast("Server error. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleLeaseAction = async (booking) => {
        setCheckingLease(true);
        try {
            const token = getToken();
            const propertyId = booking.propertyId?._id || booking.propertyId;
            const tenantId = booking.tenantId?._id || booking.tenantId;
            
            // Check if lease exists
            const checkRes = await fetch(`/api/leases/property/${propertyId}/tenant/${tenantId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const checkJson = await checkRes.json();
            
            if (checkJson.success && checkJson.data) {
                // If exists, view it
                navigate(`/leases/${checkJson.data._id}`);
            } else {
                // If it does not exist, create a draft!
                const createRes = await fetch("/api/leases", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        propertyId,
                        tenantId,
                        terms: {
                            rentAmount: booking.propertyId?.monthlyRent || 0,
                            securityDeposit: (booking.propertyId?.monthlyRent || 0) * 2,
                            leaseStartDate: new Date(),
                            leaseEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                            noticePeriodDays: 30,
                            additionalClauses: ""
                        }
                    })
                });
                const createJson = await createRes.json();
                if (createJson.success && createJson.data) {
                    showSuccessToast("Lease agreement draft created!");
                    navigate(`/leases/${createJson.data._id}`);
                } else {
                    showErrorToast(createJson.message || "Failed to create lease draft");
                }
            }
        } catch (err) {
            console.error("Lease action error:", err);
            showErrorToast("Failed to process lease agreement action.");
        } finally {
            setCheckingLease(false);
        }
    };

    const formatDateTime = (startStr, endStr) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        return {
            dateStr: start.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
            }),
            timeStr: `${start.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })} - ${end.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })}`
        };
    };

    // Filter incoming bookings
    const pendingBookings = useMemo(() => {
        return bookings.filter((b) => b.status === "pending");
    }, [bookings]);

    const confirmedBookings = useMemo(() => {
        return bookings.filter((b) => b.status === "confirmed");
    }, [bookings]);

    // Group pending bookings by property title
    const pendingGroupedByProperty = useMemo(() => {
        const groups = {};
        pendingBookings.forEach((b) => {
            const propTitle = b.propertyId?.title || "Property";
            if (!groups[propTitle]) groups[propTitle] = [];
            groups[propTitle].push(b);
        });
        return groups;
    }, [pendingBookings]);

    // Calendar logic: generate the next 7 days starting from today
    const calendarDays = useMemo(() => {
        const days = [];
        const start = new Date();
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            days.push({
                date: current,
                dateStr: current.toISOString().split("T")[0],
                label: current.toLocaleDateString("en-US", { weekday: "short" }),
                dayNum: current.getDate(),
                month: current.toLocaleDateString("en-US", { month: "short" }),
                isToday: i === 0
            });
        }
        return days;
    }, []);

    // Helper to find confirmed bookings on a specific date string (YYYY-MM-DD)
    const getConfirmedBookingsForDay = (dateStr) => {
        return confirmedBookings.filter((b) => {
            const bDateStr = new Date(b.slotStart).toISOString().split("T")[0];
            return bDateStr === dateStr;
        });
    };

    if (loading) {
        return (
            <div className="w-full py-12 flex justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading bookings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-6 text-center bg-card/45 border border-border rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-error mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Error Loading Bookings</h4>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchBookings}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-page-enter">
            {/* Booking Requests */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground">Pending Requests</h3>
                {pendingBookings.length === 0 ? (
                    <div className="p-8 text-center bg-card/45 border border-dashed border-border rounded-2xl">
                        <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs font-medium text-foreground">No pending booking requests</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">When tenants book slots, they will appear here for confirmation.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {Object.entries(pendingGroupedByProperty).map(([propertyTitle, list]) => (
                            <div key={propertyTitle} className="space-y-2.5">
                                <h4 className="text-xs font-bold text-primary px-1">{propertyTitle}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {list.map((booking) => {
                                        const { dateStr, timeStr } = formatDateTime(booking.slotStart, booking.slotEnd);
                                        const tenant = booking.tenantId || {};

                                        return (
                                            <div
                                                key={booking._id}
                                                className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3.5"
                                            >
                                                {/* Tenant info */}
                                                <div className="flex items-center gap-3">
                                                    {tenant.avatar ? (
                                                        <img
                                                            src={tenant.avatar}
                                                            alt={tenant.name}
                                                            className="w-9 h-9 rounded-full object-cover border border-border/50"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                                            {tenant.name?.[0] || "T"}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate">{tenant.name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{tenant.email}</p>
                                                    </div>
                                                </div>

                                                {/* Date & Time slots */}
                                                <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl space-y-1 text-[11px]">
                                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                                        <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                        {dateStr}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                        {timeStr}
                                                    </div>
                                                </div>

                                                {booking.notes && (
                                                    <div className="p-2 bg-muted/20 border border-border/30 rounded-xl text-[10px] text-muted-foreground italic">
                                                        "{booking.notes}"
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="flex-1 text-xs bg-success text-white border border-success/80 hover:bg-success/90"
                                                        disabled={actionLoadingId === booking._id}
                                                        onClick={() => handleAction(booking._id, "confirmed")}
                                                    >
                                                        <Check className="w-3.5 h-3.5 mr-1" />
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-xs text-error border-error/20 hover:bg-error/5 hover:text-error"
                                                        disabled={actionLoadingId === booking._id}
                                                        onClick={() => handleAction(booking._id, "cancelled")}
                                                    >
                                                        <X className="w-3.5 h-3.5 mr-1" />
                                                        Decline
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Weekly Grid Calendar Visualization */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">7-Day Confirmed Calendar</h3>
                    <Badge variant="success" size="sm">
                        {confirmedBookings.length} Confirmed {confirmedBookings.length === 1 ? "Visit" : "Visits"}
                    </Badge>
                </div>

                {/* Grid layout - Hidden on mobile, Flex/Grid on Desktop */}
                <div className="hidden md:grid grid-cols-7 gap-3">
                    {calendarDays.map((day) => {
                        const dayBookings = getConfirmedBookingsForDay(day.dateStr);

                        return (
                            <div
                                key={day.dateStr}
                                className={`rounded-xl border p-2 flex flex-col gap-2 min-h-[160px] bg-background/50 transition-colors ${
                                    day.isToday
                                        ? "border-primary/50 bg-primary/5 shadow-sm"
                                        : "border-border/40"
                                }`}
                            >
                                {/* Date Header */}
                                <div className="text-center pb-1.5 border-b border-border/30">
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{day.label}</p>
                                    <p className={`text-sm font-bold mt-0.5 leading-none ${day.isToday ? "text-primary" : "text-foreground"}`}>
                                        {day.dayNum}
                                    </p>
                                    <p className="text-[8px] text-muted-foreground opacity-75 mt-0.5">{day.month}</p>
                                </div>

                                {/* Bookings Block Grid */}
                                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                                    {dayBookings.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="text-[10px] text-muted-foreground/30 font-semibold tracking-wider">NONE</span>
                                        </div>
                                    ) : (
                                        dayBookings.map((b) => {
                                            const startTime = new Date(b.slotStart).toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false
                                            });

                                            return (
                                                <button
                                                    key={b._id}
                                                    type="button"
                                                    onClick={() => setSelectedBookingDetails(b)}
                                                    className="w-full text-left p-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-lg text-[10px] transition-all duration-150 flex flex-col gap-0.5"
                                                >
                                                    <span className="font-bold text-primary block truncate leading-tight">
                                                        {b.propertyId?.title || "Visit"}
                                                    </span>
                                                    <span className="font-semibold text-foreground/80 truncate">
                                                        {b.tenantId?.name || "Tenant"}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                        {startTime}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile View: Vertical Day-by-Day List */}
                <div className="md:hidden space-y-2.5">
                    {calendarDays.map((day) => {
                        const dayBookings = getConfirmedBookingsForDay(day.dateStr);

                        return (
                            <div
                                key={day.dateStr}
                                className={`border border-border/40 rounded-xl p-3 space-y-2 bg-background/50 ${
                                    day.isToday ? "border-primary bg-primary/5 shadow-inner" : ""
                                }`}
                            >
                                <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-foreground">{day.label}, {day.month} {day.dayNum}</span>
                                        {day.isToday && <span className="text-[9px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full uppercase">Today</span>}
                                    </div>
                                    <Badge variant="outline" size="sm">
                                        {dayBookings.length} {dayBookings.length === 1 ? "visit" : "visits"}
                                    </Badge>
                                </div>

                                {dayBookings.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground italic pl-1">No confirmed visits for today</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {dayBookings.map((b) => {
                                            const { timeStr } = formatDateTime(b.slotStart, b.slotEnd);

                                            return (
                                                <button
                                                    key={b._id}
                                                    type="button"
                                                    onClick={() => setSelectedBookingDetails(b)}
                                                    className="w-full text-left p-2.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-xl text-xs transition-colors flex items-center justify-between gap-4"
                                                >
                                                    <div className="min-w-0 space-y-0.5">
                                                        <h5 className="font-bold text-primary truncate">
                                                            {b.propertyId?.title || "Visit"}
                                                        </h5>
                                                        <p className="text-foreground/80 font-medium truncate">
                                                            Tenant: {b.tenantId?.name || "Someone"}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                                            {timeStr}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-primary/70 flex-shrink-0" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Visit Details modal dialog */}
            {selectedBookingDetails && (
                <Dialog open={!!selectedBookingDetails} onOpenChange={() => setSelectedBookingDetails(null)}>
                    <DialogContent className="max-w-md p-6 rounded-2xl">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary" />
                                    Confirmed Visit Details
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Property: <span className="font-semibold text-foreground">{selectedBookingDetails.propertyId?.title}</span>
                                </p>
                            </div>

                            <div className="p-4 bg-muted/40 border border-border/40 rounded-xl text-xs space-y-2.5">
                                <div className="flex justify-between pb-1.5 border-b border-border/30">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-bold text-foreground">
                                        {new Date(selectedBookingDetails.slotStart).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between pb-1.5 border-b border-border/30">
                                    <span className="text-muted-foreground">Time Slot:</span>
                                    <span className="font-bold text-primary">
                                        {new Date(selectedBookingDetails.slotStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        {" - "}
                                        {new Date(selectedBookingDetails.slotEnd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                                <div className="flex justify-between pb-1.5 border-b border-border/30">
                                    <span className="text-muted-foreground">Tenant Name:</span>
                                    <span className="font-bold text-foreground">{selectedBookingDetails.tenantId?.name}</span>
                                </div>
                                <div className="flex justify-between pb-1.5 border-b border-border/30">
                                    <span className="text-muted-foreground">Tenant Email:</span>
                                    <span className="font-semibold text-foreground">{selectedBookingDetails.tenantId?.email}</span>
                                </div>
                                {selectedBookingDetails.tenantId?.phone && (
                                    <div className="flex justify-between pb-1.5 border-b border-border/30">
                                        <span className="text-muted-foreground">Tenant Phone:</span>
                                        <span className="font-semibold text-foreground">{selectedBookingDetails.tenantId?.phone}</span>
                                    </div>
                                )}
                                {selectedBookingDetails.notes && (
                                    <div className="pt-1.5 flex flex-col gap-1">
                                        <span className="text-muted-foreground">Tenant's Note:</span>
                                        <p className="font-medium text-foreground bg-background border border-border/60 p-2 rounded-lg italic">
                                            "{selectedBookingDetails.notes}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                {["confirmed", "completed"].includes(selectedBookingDetails.status) && (
                                    <Button
                                        onClick={() => handleLeaseAction(selectedBookingDetails)}
                                        disabled={checkingLease}
                                        className="w-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        {checkingLease ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        Lease Agreement
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedBookingDetails(null)}
                                    className="w-full text-xs font-bold py-2.5 rounded-xl border border-border transition-colors"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
