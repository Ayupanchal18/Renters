import { Input } from "../ui/input";

const PROPERTY_TYPES = {
    room: ["Single Room", "Double Room", "Triple Room", "Dormitory"],
    apartment: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "Villa"],
    commercial: ["Shop", "Office", "Co-working Space", "Hall"],
};

export default function StepBasicDetails({ formData, setFormData, validationErrors }) {
    const types = PROPERTY_TYPES[formData.category] || [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Basic Details</h2>

            {/* Title */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Property Title *</label>
                <Input
                    placeholder="e.g., Spacious 2 BHK Apartment in Downtown"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={validationErrors.title ? "border-red-500" : ""}
                />
                {validationErrors.title && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.title}</p>
                )}
            </div>

            {/* Property Type */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Property Type *</label>
                <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500${validationErrors.propertyType ? "border-red-500" : "border-slate-300"
                        }`}
                >
                    <option value="">Select property type</option>
                    {types.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                {validationErrors.propertyType && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.propertyType}</p>
                )}
            </div>

            {/* Furnishing */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Furnishing Status *</label>
                <div className="flex gap-4">
                    {["unfurnished", "semi", "fully"].map((option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="furnishing"
                                value={option}
                                checked={formData.furnishing === option}
                                onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                                className="w-4 h-4"
                            />
                            <span className="text-slate-700 capitalize">
                                {option === "semi"
                                    ? "Semi-Furnished"
                                    : option.charAt(0).toUpperCase() + option.slice(1)}
                            </span>
                        </label>
                    ))}
                </div>
                {validationErrors.furnishing && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.furnishing}</p>
                )}
            </div>

            {/* Available From */}
            <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Available From *</label>
                <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500${validationErrors.availableFrom ? "border-red-500" : "border-slate-300"
                        }`}
                />
                {validationErrors.availableFrom && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.availableFrom}</p>
                )}
            </div>
        </div>
    );
}
