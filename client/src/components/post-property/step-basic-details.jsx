import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Lightbulb } from "lucide-react";

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
    const descLength = (formData.description || '').length;

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
                    maxLength={120}
                />
                {/* Nudge */}
                {(!formData.title || formData.title.length < 10) && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            <strong>Pro tip:</strong> Titles with location and size get 40% more clicks. Try: &ldquo;{formData.bedrooms || '2'} BHK {formData.furnishing === 'fully' ? 'Furnished' : ''} {formData.category === 'flat' ? 'Flat' : 'Property'} in {formData.city || 'Koramangala'}&rdquo;
                        </p>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    {validationErrors.title && (
                        <p className="text-destructive text-xs sm:text-sm">{validationErrors.title}</p>
                    )}
                    <span className={`text-xs ml-auto ${formData.title?.length > 100 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {formData.title?.length || 0}/120
                    </span>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground font-semibold text-sm sm:text-base">
                    Description <span className="text-muted-foreground font-normal">(Recommended)</span>
                </Label>
                <textarea
                    id="description"
                    placeholder="Describe your property — mention nearby landmarks, transport, schools, unique features..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    maxLength={2000}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none border-input"
                />
                <div className="flex justify-between items-center">
                    {descLength > 0 && descLength < 50 && (
                        <p className="text-xs text-amber-500">
                            Add more detail — descriptions over 100 words get 25% more inquiries.
                        </p>
                    )}
                    <span className={`text-xs ml-auto ${descLength > 1800 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {descLength}/2000
                    </span>
                </div>
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
                    min={new Date().toISOString().split('T')[0]}
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
