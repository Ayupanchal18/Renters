import { Input } from "../ui/input";
import { Label } from "../ui/label";

const PROPERTY_TYPES = {
    room: ["Single Room", "Double Room", "Triple Room", "Dormitory"],
    flat: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "Villa"],
    house: ["Independent House", "Villa", "Bungalow", "Farmhouse"],
    pg: ["Single Sharing", "Double Sharing", "Triple Sharing", "Four Sharing"],
    hostel: ["Single Room", "Double Sharing", "Dormitory"],
    commercial: ["Shop", "Office", "Co-working Space", "Hall", "Warehouse"],
};

export default function StepBasicDetails({ formData, setFormData, validationErrors }) {
    const types = PROPERTY_TYPES[formData.category] || [];

    return (
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Basic Details</h2>

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-semibold text-sm sm:text-base">Property Title *</Label>
                <Input
                    id="title"
                    placeholder="e.g., Spacious 2 BHK Apartment in Downtown"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`text-sm sm:text-base ${validationErrors.title ? "border-destructive" : ""}`}
                />
                {validationErrors.title && (
                    <p className="text-destructive text-xs sm:text-sm">{validationErrors.title}</p>
                )}
            </div>

            {/* Property Type */}
            <div className="space-y-2">
                <Label htmlFor="propertyType" className="text-foreground font-semibold text-sm sm:text-base">Property Type *</Label>
                <select
                    id="propertyType"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring ${validationErrors.propertyType ? "border-destructive" : "border-input"
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
                    <p className="text-destructive text-xs sm:text-sm">{validationErrors.propertyType}</p>
                )}
            </div>

            {/* Furnishing */}
            <div className="space-y-3">
                <Label className="text-foreground font-semibold text-sm sm:text-base">Furnishing Status *</Label>
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                    {["unfurnished", "semi", "fully"].map((option) => (
                        <label 
                            key={option} 
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.furnishing === option 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border hover:border-primary/50"
                            }`}
                        >
                            <input
                                type="radio"
                                name="furnishing"
                                value={option}
                                checked={formData.furnishing === option}
                                onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                                className="w-4 h-4 text-primary accent-primary"
                            />
                            <span className="text-foreground text-sm sm:text-base">
                                {option === "semi"
                                    ? "Semi-Furnished"
                                    : option === "fully"
                                        ? "Fully Furnished"
                                        : "Unfurnished"}
                            </span>
                        </label>
                    ))}
                </div>
                {validationErrors.furnishing && (
                    <p className="text-destructive text-xs sm:text-sm">{validationErrors.furnishing}</p>
                )}
            </div>

            {/* Available From */}
            <div className="space-y-2">
                <Label htmlFor="availableFrom" className="text-foreground font-semibold text-sm sm:text-base">Available From *</Label>
                <input
                    id="availableFrom"
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring ${validationErrors.availableFrom ? "border-destructive" : "border-input"
                        }`}
                />
                {validationErrors.availableFrom && (
                    <p className="text-destructive text-xs sm:text-sm">{validationErrors.availableFrom}</p>
                )}
            </div>
        </div>
    );
}
