import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MapPin, Navigation } from 'lucide-react';

const CITIES = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Pune",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
    "Chandigarh",
    "Indore"
];

export default function StepLocation({ formData, setFormData, validationErrors }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <MapPin size={28} className="text-primary" />
                Property Location
            </h2>

            {/* City */}
            <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground font-semibold">City *</Label>
                <select
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${validationErrors.city ? "border-destructive" : "border-input"
                        }`}
                >
                    <option value="">Select city</option>
                    {CITIES.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
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
                        placeholder="Latitude, Longitude or Google Maps URL"
                        value={formData.mapLocation}
                        onChange={(e) => setFormData({ ...formData, mapLocation: e.target.value })}
                        className="flex-1"
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
                        className="whitespace-nowrap flex items-center gap-2"
                    >
                        <Navigation size={16} />
                        Use My Location
                    </Button>
                </div>
            </div>
        </div>
    );
}
