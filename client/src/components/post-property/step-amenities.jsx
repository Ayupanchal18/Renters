import { Check } from 'lucide-react';

const AMENITIES = {
    room: ["WiFi", "AC", "Bed", "Wardrobe", "CCTV", "Power Backup", "RO Water", "Geyser", "TV", "Washing Machine"],
    flat: ["Lift", "Gym", "Swimming Pool", "Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Playground", "Club House", "Intercom"],
    house: ["Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Servant Room", "Study Room", "Terrace"],
    pg: ["WiFi", "AC", "Meals", "Laundry", "CCTV", "Power Backup", "RO Water", "Housekeeping", "TV", "Geyser"],
    hostel: ["WiFi", "AC", "Meals", "Laundry", "CCTV", "Power Backup", "RO Water", "Study Room", "Common Room"],
    commercial: ["Lift", "Security", "Parking", "CCTV", "Washroom", "Power Backup", "Conference Room", "Pantry", "Reception"],
};

export default function StepAmenities({ formData, setFormData, validationErrors }) {
    const amenitiesList = AMENITIES[formData.category] || AMENITIES.flat;

    const toggleAmenity = (amenity) => {
        setFormData({
            ...formData,
            amenities: formData.amenities.includes(amenity)
                ? formData.amenities.filter((a) => a !== amenity)
                : [...formData.amenities, amenity],
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Amenities</h2>
                <p className="text-muted-foreground">Choose the amenities available in your property</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amenitiesList.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);

                    return (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 font-medium text-left ${isSelected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-foreground hover:border-primary/50"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span>{amenity}</span>
                                {isSelected && <Check size={20} className="text-primary" />}
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
