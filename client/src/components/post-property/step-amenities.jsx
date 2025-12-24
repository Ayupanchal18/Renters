import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

// Fallback amenities if API fails
const FALLBACK_AMENITIES = {
    room: ["WiFi", "AC", "Bed", "Wardrobe", "CCTV", "Power Backup", "RO Water", "Geyser", "TV", "Washing Machine"],
    flat: ["Lift", "Gym", "Swimming Pool", "Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Playground", "Club House", "Intercom"],
    house: ["Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Servant Room", "Study Room", "Terrace"],
    pg: ["WiFi", "AC", "Meals", "Laundry", "CCTV", "Power Backup", "RO Water", "Housekeeping", "TV", "Geyser"],
    hostel: ["WiFi", "AC", "Meals", "Laundry", "CCTV", "Power Backup", "RO Water", "Study Room", "Common Room"],
    commercial: ["Lift", "Security", "Parking", "CCTV", "Washroom", "Power Backup", "Conference Room", "Pantry", "Reception"],
};

export default function StepAmenities({ formData, setFormData, validationErrors }) {
    const [amenitiesList, setAmenitiesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAmenities();
    }, []);

    const fetchAmenities = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/categories/amenities');
            const data = await response.json();
            
            if (data.success && data.data?.amenities?.length > 0) {
                // Extract just the names from the API response
                const amenityNames = data.data.amenities.map(a => a.name);
                setAmenitiesList(amenityNames);
            } else {
                // Use fallback based on category
                const fallback = FALLBACK_AMENITIES[formData.category] || FALLBACK_AMENITIES.flat;
                setAmenitiesList(fallback);
            }
        } catch (err) {
            console.error('Error fetching amenities:', err);
            setError('Failed to load amenities');
            // Use fallback
            const fallback = FALLBACK_AMENITIES[formData.category] || FALLBACK_AMENITIES.flat;
            setAmenitiesList(fallback);
        } finally {
            setLoading(false);
        }
    };

    const toggleAmenity = (amenity) => {
        setFormData({
            ...formData,
            amenities: formData.amenities.includes(amenity)
                ? formData.amenities.filter((a) => a !== amenity)
                : [...formData.amenities, amenity],
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Select Amenities</h2>
                    <p className="text-muted-foreground">Choose the amenities available in your property</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading amenities...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Amenities</h2>
                <p className="text-muted-foreground">Choose the amenities available in your property</p>
            </div>

            {error && (
                <p className="text-sm text-amber-600">Using default amenities list</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {amenitiesList.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);

                    return (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 font-medium text-left text-sm sm:text-base ${isSelected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-foreground hover:border-primary/50"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{amenity}</span>
                                {isSelected && <Check size={18} className="text-primary shrink-0" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {formData.amenities.length > 0 && (
                <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formData.amenities.length}</span> amenities selected
                    </p>
                </div>
            )}
        </div>
    );
}
