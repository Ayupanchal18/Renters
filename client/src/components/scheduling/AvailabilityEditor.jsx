import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Plus, Trash2, Save, X, Eye, ShieldAlert, Check } from "lucide-react";
import { getToken } from "../../utils/auth";
import { showSuccessToast, showErrorToast } from "../../utils/toastNotifications";

const DAYS_OF_WEEK = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 0, label: "Sunday" }
];

export default function AvailabilityEditor({ propertyId, propertyTitle, onClose }) {
    // State for weekly templates
    // Initialize weekly schedules state (Monday to Sunday)
    const [weeklySchedule, setWeeklySchedule] = useState(
        DAYS_OF_WEEK.map(d => ({
            dayOfWeek: d.value,
            label: d.label,
            enabled: false,
            startTime: "09:00",
            endTime: "17:00",
            slotDurationMinutes: 30
        }))
    );

    // State for date-specific overrides
    const [overrides, setOverrides] = useState([]);

    // Override Form State
    const [overrideDate, setOverrideDate] = useState("");
    const [overrideIsActive, setOverrideIsActive] = useState(false); // default to Block (false)
    const [overrideStartTime, setOverrideStartTime] = useState("09:00");
    const [overrideEndTime, setOverrideEndTime] = useState("17:00");
    const [overrideDuration, setOverrideDuration] = useState(30);

    // Preview and Loading states
    const [computedPreview, setComputedPreview] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch computed preview
    const fetchComputedPreview = useCallback(async () => {
        setLoadingPreview(true);
        try {
            const res = await fetch(`/api/properties/${propertyId}/availability?days=7`);
            const data = await res.json();
            if (data.success) {
                setComputedPreview(data.slots || []);
            }
        } catch (err) {
            console.error("Error fetching computed preview:", err);
        } finally {
            setLoadingPreview(false);
        }
    }, [propertyId]);

    // Fetch existing raw rules
    const fetchRawRules = useCallback(async () => {
        setLoadingData(true);
        const token = getToken();
        try {
            const res = await fetch(`/api/properties/${propertyId}/availability/rules`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success && data.rules) {
                const fetchedRules = data.rules;
                
                // Set weekly templates
                setWeeklySchedule(prev => 
                    prev.map(day => {
                        const rule = fetchedRules.find(r => r.type === "recurring" && r.dayOfWeek === day.dayOfWeek);
                        if (rule) {
                            return {
                                ...day,
                                enabled: rule.isActive,
                                startTime: rule.startTime,
                                endTime: rule.endTime,
                                slotDurationMinutes: rule.slotDurationMinutes
                            };
                        }
                        return day;
                    })
                );

                // Set overrides
                const overrideRules = fetchedRules.filter(r => r.type === "override").map(r => ({
                    id: r._id,
                    specificDate: r.specificDate ? new Date(r.specificDate).toISOString().split("T")[0] : "",
                    startTime: r.startTime,
                    endTime: r.endTime,
                    slotDurationMinutes: r.slotDurationMinutes,
                    isActive: r.isActive
                }));
                setOverrides(overrideRules);
            }
        } catch (err) {
            console.error("Error fetching rules:", err);
            showErrorToast("Failed to load existing availability settings.");
        } finally {
            setLoadingData(false);
        }
    }, [propertyId]);

    useEffect(() => {
        if (propertyId) {
            fetchRawRules();
            fetchComputedPreview();
        }
    }, [propertyId, fetchRawRules, fetchComputedPreview]);

    // Toggle day availability
    const handleWeeklyCheckChange = (dayOfWeek) => {
        setWeeklySchedule(prev =>
            prev.map(day =>
                day.dayOfWeek === dayOfWeek ? { ...day, enabled: !day.enabled } : day
            )
        );
    };

    // Update weekly hours/duration
    const handleWeeklyTimeChange = (dayOfWeek, field, value) => {
        setWeeklySchedule(prev =>
            prev.map(day =>
                day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
            )
        );
    };

    // Add Date Override
    const handleAddOverride = (e) => {
        e.preventDefault();
        if (!overrideDate) {
            showErrorToast("Please select a valid date for override.");
            return;
        }

        // Check duplicate override date
        if (overrides.some(o => o.specificDate === overrideDate)) {
            showErrorToast("An override already exists for this date. Remove it first to update.");
            return;
        }

        const newOverride = {
            id: Date.now().toString(), // temporary client-side ID
            specificDate: overrideDate,
            isActive: overrideIsActive,
            startTime: overrideIsActive ? overrideStartTime : "00:00",
            endTime: overrideIsActive ? overrideEndTime : "00:00",
            slotDurationMinutes: overrideDuration
        };

        setOverrides(prev => [...prev, newOverride]);
        setOverrideDate("");
        setOverrideIsActive(false);
        showSuccessToast("Override added to list. Click save to apply changes.");
    };

    // Remove Date Override
    const handleRemoveOverride = (id) => {
        setOverrides(prev => prev.filter(o => o.id !== id));
    };

    // Save All Rules
    const handleSave = async () => {
        setSaving(true);
        const token = getToken();

        // Construct request payload
        const slotsPayload = [];

        // 1. Recurring weekly templates
        weeklySchedule.forEach(day => {
            slotsPayload.push({
                type: "recurring",
                dayOfWeek: day.dayOfWeek,
                startTime: day.startTime,
                endTime: day.endTime,
                slotDurationMinutes: day.slotDurationMinutes,
                isActive: day.enabled
            });
        });

        // 2. Overrides
        overrides.forEach(ov => {
            slotsPayload.push({
                type: "override",
                specificDate: ov.specificDate,
                startTime: ov.startTime,
                endTime: ov.endTime,
                slotDurationMinutes: ov.slotDurationMinutes,
                isActive: ov.isActive
            });
        });

        try {
            const res = await fetch(`/api/properties/${propertyId}/availability`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ slots: slotsPayload })
            });

            const data = await res.json();
            if (data.success) {
                showSuccessToast("Availability settings saved successfully.");
                fetchComputedPreview();
                fetchRawRules();
            } else {
                showErrorToast(data.error || "Failed to save settings.");
            }
        } catch (err) {
            console.error("Error saving availability:", err);
            showErrorToast("Server error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-5xl w-full mx-auto overflow-hidden animate-page-enter">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
                <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Manage Visit Availability
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Property: <span className="font-semibold text-foreground">{propertyTitle}</span>
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Grid Layout splits settings and preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
                
                {/* Left Columns - Setup Settings */}
                <div className="lg:col-span-2 p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    
                    {/* Section 1: Weekly Template */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                1
                            </span>
                            <h3 className="text-sm font-semibold text-foreground">Weekly Recurring Availability</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Check the days of the week you are generally available to host property visits, and specify time slots.
                        </p>

                        <div className="space-y-3">
                            {weeklySchedule.map((day) => (
                                <div
                                    key={day.dayOfWeek}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                                        day.enabled
                                            ? "border-primary/20 bg-primary/5 shadow-sm"
                                            : "border-border/50 bg-card hover:bg-muted/10"
                                    }`}
                                >
                                    {/* Left toggle */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`day-${day.dayOfWeek}`}
                                            checked={day.enabled}
                                            onChange={() => handleWeeklyCheckChange(day.dayOfWeek)}
                                            className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                                        />
                                        <label
                                            htmlFor={`day-${day.dayOfWeek}`}
                                            className="text-xs font-semibold text-foreground cursor-pointer select-none min-w-[80px]"
                                        >
                                            {day.label}
                                        </label>
                                    </div>

                                    {/* Right inputs */}
                                    {day.enabled ? (
                                        <div className="flex flex-wrap items-center gap-2.5 mt-3 sm:mt-0">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(e) => handleWeeklyTimeChange(day.dayOfWeek, "startTime", e.target.value)}
                                                    className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                                />
                                                <span className="text-xs text-muted-foreground">to</span>
                                                <input
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(e) => handleWeeklyTimeChange(day.dayOfWeek, "endTime", e.target.value)}
                                                    className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-muted-foreground">Duration:</span>
                                                <select
                                                    value={day.slotDurationMinutes}
                                                    onChange={(e) => handleWeeklyTimeChange(day.dayOfWeek, "slotDurationMinutes", Number(e.target.value))}
                                                    className="px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                                >
                                                    <option value={15}>15 min</option>
                                                    <option value={30}>30 min</option>
                                                    <option value={60}>60 min</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground mt-1 sm:mt-0 italic">
                                            Unavailable
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Date Overrides */}
                    <div className="space-y-4 pt-4 border-t border-border/60">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                2
                            </span>
                            <h3 className="text-sm font-semibold text-foreground">Specific Date Overrides</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Block specific dates (e.g. holidays) or add customized slots for one-off days.
                        </p>

                        {/* Add Override Form */}
                        <form onSubmit={handleAddOverride} className="p-4 bg-muted/30 border border-border/60 rounded-xl space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Select Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={overrideDate}
                                        onChange={(e) => setOverrideDate(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer py-2">
                                        <input
                                            type="checkbox"
                                            checked={overrideIsActive}
                                            onChange={(e) => setOverrideIsActive(e.target.checked)}
                                            className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                                        />
                                        <span>Available on this date?</span>
                                    </label>
                                </div>
                            </div>

                            {overrideIsActive && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-border/40 pt-3 animate-fade-in">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-muted-foreground mb-0.5">Start Time</label>
                                            <input
                                                type="time"
                                                value={overrideStartTime}
                                                onChange={(e) => setOverrideStartTime(e.target.value)}
                                                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-muted-foreground mb-0.5">End Time</label>
                                            <input
                                                type="time"
                                                value={overrideEndTime}
                                                onChange={(e) => setOverrideEndTime(e.target.value)}
                                                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-muted-foreground mb-0.5">Slot Duration</label>
                                        <select
                                            value={overrideDuration}
                                            onChange={(e) => setOverrideDuration(Number(e.target.value))}
                                            className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none"
                                        >
                                            <option value={15}>15 min</option>
                                            <option value={30}>30 min</option>
                                            <option value={60}>60 min</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Override
                            </button>
                        </form>

                        {/* List of current overrides */}
                        {overrides.length > 0 && (
                            <div className="border border-border/40 rounded-xl divide-y divide-border/40 bg-card overflow-hidden">
                                {overrides.map((ov) => (
                                    <div key={ov.id} className="flex items-center justify-between p-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${ov.isActive ? "bg-success" : "bg-destructive"}`} />
                                            <div>
                                                <span className="font-semibold text-foreground">
                                                    {new Date(ov.specificDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </span>
                                                <span className="text-muted-foreground ml-2">
                                                    {ov.isActive ? `(${ov.startTime} - ${ov.endTime}, ${ov.slotDurationMinutes} min)` : "(Blocked Entire Day)"}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveOverride(ov.id)}
                                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Live Preview */}
                <div className="p-6 bg-muted/10 flex flex-col justify-between max-h-[75vh]">
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Eye className="w-4.5 h-4.5 text-primary" />
                            Live 7-Day Preview
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Here are the slots tenants will be able to book based on your settings above.
                        </p>

                        {loadingPreview ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : computedPreview.length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(
                                    computedPreview.reduce((groups, slot) => {
                                        const dateStr = new Date(slot.slotStart).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                                        if (!groups[dateStr]) groups[dateStr] = [];
                                        groups[dateStr].push(slot);
                                        return groups;
                                    }, {})
                                ).map(([dateStr, slots]) => (
                                    <div key={dateStr} className="space-y-1.5">
                                        <h4 className="text-[11px] font-bold text-foreground border-b border-border/40 pb-0.5">{dateStr}</h4>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {slots.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-center gap-1 py-1 px-2 bg-card border border-border/60 rounded-md text-[10px] text-muted-foreground font-medium"
                                                >
                                                    <Clock className="w-3 h-3 text-primary/70" />
                                                    {new Date(s.slotStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center p-4 border border-dashed border-border rounded-xl bg-card">
                                <ShieldAlert className="w-8 h-8 text-amber-500/80 mb-2" />
                                <h4 className="text-xs font-semibold text-foreground mb-0.5">No slots available</h4>
                                <p className="text-[10px] text-muted-foreground">Toggle weekly schedules or add available date overrides.</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Save Action */}
                    <div className="border-t border-border/60 pt-4 mt-6 bg-card sm:bg-transparent -mx-6 -mb-6 p-6 sm:p-0">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/50 text-sm font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-98"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Availability
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
