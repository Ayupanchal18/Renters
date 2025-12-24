import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fallback cities if API fails
const FALLBACK_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"
];

export default function StepLocation({ formData, setFormData, validationErrors }) {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch cities from API
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch('/api/locations/cities');
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    setCities(data.data.map(city => city.name));
                } else {
                    setCities(FALLBACK_CITIES);
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
                setCities(FALLBACK_CITIES);
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <MapPin size={28} className="text-primary" />
                Property Location
            </h2>

            {/* City */}
            <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground font-semibold">City *</Label>
                <div className="relative">
                    <select
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={loading}
                        className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${validationErrors.city ? "border-destructive" : "border-input"
                            } ${loading ? "opacity-50" : ""}`}
                    >
                        <option value="">{loading ? "Loading cities..." : "Select city"}</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                    {loading && (
                        <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                {validationErrors.city && (
                    <p className="text-destructive text-sm">{validationErrors.city}</p>
                )}
            </div>

            {/* Full Address */}
            <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground font-semibold">Full Address *</Label>
                <textarea
                    id="address"
                    placeholder="Enter complete address including building, street, area"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none ${validationErrors.address ? "border-destructive" : "border-input"
                        }`}
                />
                {validationErrors.address && (
                    <p className="text-destructive text-sm">{validationErrors.address}</p>
                )}
            </div>

            {/* Map Location */}
            <div className="space-y-2">
                <Label htmlFor="mapLocation" className="text-foreground font-semibold">
                    Map Location (Optional)
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="mapLocation"
                        placeholder="Latitude, Longitude"
                        value={formData.mapLocation}
                        onChange={(e) => setFormData({ ...formData, mapLocation: e.target.value })}
                        className="flex-1 text-xs sm:text-sm"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const lat = position.coords.latitude;
                                        const lng = position.coords.longitude;
                                        setFormData({ ...formData, mapLocation: `${lat}, ${lng}` });
                                    },
                                    (error) => {
                                        alert('Unable to retrieve your location. Please enter manually.');
                                        console.error(error);
                                    }
                                );
                            } else {
                                alert('Geolocation is not supported by your browser.');
                            }
                        }}
                        className="whitespace-nowrap flex items-center gap-1.5 text-xs sm:text-sm px-3"
                    >
                        <Navigation size={14} />
                        <span className="hidden sm:inline">Use My Location</span>
                        <span className="sm:hidden">Location</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
