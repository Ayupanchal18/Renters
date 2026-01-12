import React, { useState, useEffect } from 'react';
import { Car, Clock, MapPin, Navigation, Loader2, Save, X } from 'lucide-react';
import { Button } from '../ui/button';

const DEPARTURE_TIMES = [
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
];

const STORAGE_KEY = 'commute_preferences';

export default function CommuteCalculator({ propertyCoords }) {
    const [destination, setDestination] = useState('');
    const [departureTime, setDepartureTime] = useState('09:00');
    const [isLoading, setIsLoading] = useState(false);
    const [hasSavedDestination, setHasSavedDestination] = useState(false);

    // Load saved preferences
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const prefs = JSON.parse(saved);
                if (prefs.destination) {
                    setDestination(prefs.destination);
                    setHasSavedDestination(true);
                }
                if (prefs.departureTime) {
                    setDepartureTime(prefs.departureTime);
                }
            }
        } catch (e) {
            console.error('Error loading commute preferences:', e);
        }
    }, []);

    // Save preferences to localStorage
    const savePreferences = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                destination,
                departureTime
            }));
            setHasSavedDestination(true);
        } catch (e) {
            console.error('Error saving commute preferences:', e);
        }
    };

    // Clear saved destination
    const clearSavedDestination = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setDestination('');
            setHasSavedDestination(false);
        } catch (e) {
            console.error('Error clearing commute preferences:', e);
        }
    };

    // Calculate commute by opening Google Maps
    const calculateCommute = () => {
        if (!destination.trim() || !propertyCoords) return;

        setIsLoading(true);

        // Build Google Maps directions URL
        const origin = `${propertyCoords.lat},${propertyCoords.lng}`;
        const encodedDestination = encodeURIComponent(destination);
        
        // Google Maps URL with departure time
        // Note: departure_time in Google Maps URL doesn't work for future times in basic URLs,
        // but the URL will still show the route and current traffic conditions
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodedDestination}&travelmode=driving`;

        // Save preferences before opening maps
        savePreferences();

        // Open in new tab
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        
        setIsLoading(false);
    };

    // Get departure time label
    const getDepartureLabel = () => {
        const time = DEPARTURE_TIMES.find(t => t.value === departureTime);
        return time ? time.label : '9:00 AM';
    };

    if (!propertyCoords) return null;

    return (
        <div className="mt-5 pt-5 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Commute Calculator
            </h3>

            <div className="space-y-3">
                {/* Destination Input */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                        Your destination (e.g., office address)
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Enter your office or destination address..."
                            className="w-full pl-9 pr-10 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/60"
                        />
                        {hasSavedDestination && (
                            <button
                                onClick={clearSavedDestination}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                title="Clear saved destination"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {hasSavedDestination && (
                        <p className="text-[10px] text-primary/70 mt-1 flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            Saved for future visits
                        </p>
                    )}
                </div>

                {/* Departure Time */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                        Typical departure time
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={departureTime}
                            onChange={(e) => setDepartureTime(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            {DEPARTURE_TIMES.map(time => (
                                <option key={time.value} value={time.value}>
                                    {time.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Calculate Button */}
                <Button
                    onClick={calculateCommute}
                    disabled={!destination.trim() || isLoading}
                    className="w-full mt-2 gap-2"
                    variant="default"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Calculating...
                        </>
                    ) : (
                        <>
                            <Navigation className="w-4 h-4" />
                            Calculate Commute to {destination.trim() ? 'Destination' : '...'}
                        </>
                    )}
                </Button>

                {/* Info Text */}
                <p className="text-[11px] text-muted-foreground text-center">
                    Opens Google Maps with directions and live traffic info
                </p>
            </div>
        </div>
    );
}
