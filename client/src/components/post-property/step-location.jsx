import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { INDIAN_STATES } from '@shared/propertyTypes';

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
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <MapPin size={24} className="text-primary" />
                Property Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* City */}
                <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground font-semibold text-sm sm:text-base">City *</Label>
                    <div className="relative">
                        <select
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            disabled={loading}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring ${validationErrors.city ? "border-destructive" : "border-input"
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
                        <p className="text-destructive text-xs sm:text-sm">{validationErrors.city}</p>
                    )}
                </div>

                {/* State */}
                <div className="space-y-2">
                    <Label htmlFor="state" className="text-foreground font-semibold text-sm sm:text-base">
                        State <span className="text-muted-foreground font-normal">(Recommended)</span>
                    </Label>
                    <select
                        id="state"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring border-input"
                    >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Locality / Society Name */}
            <div className="space-y-2">
                <Label htmlFor="locality" className="text-foreground font-semibold text-sm sm:text-base">
                    Locality / Society Name <span className="text-muted-foreground font-normal">(Recommended)</span>
                </Label>
                <Input
                    id="locality"
                    placeholder="e.g., Koramangala, Baner, Whitefield, Green Valley Society"
                    value={formData.locality || ''}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground">
                    Adding locality helps tenants find your property 3× faster in search.
                </p>
            </div>

            {/* Full Address */}
            <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground font-semibold text-sm sm:text-base">Full Address *</Label>
                <textarea
                    id="address"
                    placeholder="Enter complete address including building, street, area"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none ${validationErrors.address ? "border-destructive" : "border-input"
                        }`}
                />
                {validationErrors.address && (
                    <p className="text-destructive text-xs sm:text-sm">{validationErrors.address}</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Pincode */}
                <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-foreground font-semibold text-sm sm:text-base">
                        Pin Code <span className="text-muted-foreground font-normal">(Recommended)</span>
                    </Label>
                    <Input
                        id="pincode"
                        placeholder="e.g., 560034"
                        value={formData.pincode || ''}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setFormData({ ...formData, pincode: val });
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        className={`text-sm sm:text-base ${validationErrors.pincode ? "border-destructive" : ""}`}
                    />
                    {validationErrors.pincode && (
                        <p className="text-destructive text-xs sm:text-sm">{validationErrors.pincode}</p>
                    )}
                </div>

                {/* Map Location */}
                <div className="space-y-2">
                    <Label htmlFor="mapLocation" className="text-foreground font-semibold text-sm sm:text-base">
                        Map Location <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="mapLocation"
                            placeholder="Latitude, Longitude"
                            value={formData.mapLocation}
                            onChange={(e) => setFormData({ ...formData, mapLocation: e.target.value })}
                            className="flex-1 text-sm"
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
                            <span className="hidden sm:inline">Use Location</span>
                            <span className="sm:hidden">GPS</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
