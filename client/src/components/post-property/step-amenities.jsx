import { Check } from 'lucide-react';

const AMENITIES = {
    room: ["WiFi", "AC", "Bed", "Wardrobe", "CCTV", "Power Backup", "RO Water"],
    apartment: ["Lift", "Gym", "Swimming Pool", "Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Playground"],
    commercial: ["Lift", "Security", "Parking", "CCTV", "Washroom", "Power Backup", "Conference Room"],
};

export default function StepAmenities({ formData, setFormData, validationErrors }) {
    const amenitiesList = AMENITIES[formData.category] || [];

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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Amenities</h2>
            <p className="text-slate-600 mb-6">Choose the amenities available in your property</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amenitiesList.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);

                    return (
                        <button
                            key={amenity}
                            onClick={() => toggleAmenity(amenity)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 font-medium${isSelected
                                    ? "border-blue-600 bg-blue-50 text-blue-600"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span>{amenity}</span>
                                {isSelected && <Check size={20} />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
