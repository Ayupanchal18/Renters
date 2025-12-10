import { Input } from "../ui/input";
import { MapPin } from 'lucide-react';

const CITIES = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Pune",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad"
];

export default function StepLocation({ formData, setFormData, validationErrors }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin size={28} className="text-blue-600" />
                Property Location
            </h2>

            {/* City */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">City *</label>
                <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500${validationErrors.city ? "border-red-500" : "border-slate-300"
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
                    <p className="text-red-600 text-sm mt-1">{validationErrors.city}</p>
                )}
            </div>

            {/* Full Address */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Full Address *</label>
                <textarea
                    placeholder="Enter complete address including building, street, area"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none${validationErrors.address ? "border-red-500" : "border-slate-300"
                        }`}
                />
                {validationErrors.address && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.address}</p>
                )}
            </div>

            {/* Map Location */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Map Location (Optional)
                </label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Latitude, Longitude or Google Maps URL"
                        value={formData.mapLocation}
                        onChange={(e) => setFormData({ ...formData, mapLocation: e.target.value })}
                    />
                    <button
                        type="button"
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Use My Location
                    </button>
                </div>
            </div>
        </div>
    );
}
