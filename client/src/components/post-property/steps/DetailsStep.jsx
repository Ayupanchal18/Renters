import { useState, useEffect } from "react";
import { Plus, Minus, Check, Loader2, Building } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
    WATER_SUPPLY_OPTIONS,
    WATER_SUPPLY_LABELS,
    POWER_BACKUP_OPTIONS,
    POWER_BACKUP_LABELS,
    OWNER_TYPES,
    OWNER_TYPE_LABELS
} from "@shared/propertyTypes";
import { validateFieldInline } from "@shared/validation/wizard";

const FALLBACK_AMENITIES = {
    room: ["WiFi", "AC", "Bed", "Wardrobe", "CCTV", "Power Backup", "RO Water", "Geyser", "TV", "Washing Machine"],
    flat: ["Lift", "Gym", "Swimming Pool", "Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Playground", "Club House", "Intercom"],
    house: ["Garden", "Security", "Parking", "Power Backup", "RO Water", "CCTV", "Servant Room", "Study Room", "Terrace"],
    pg: ["WiFi", "AC", "Meals", "Laundry", "CCTV", "Power Backup", "RO Water", "Housekeeping", "TV", "Geyser"],
    hostel: ["WiFi", "AC", "Meals", "Laundry", "CCTV", "Power Backup", "RO Water", "Study Room", "Common Room"],
    commercial: ["Lift", "Security", "Parking", "CCTV", "Washroom", "Power Backup", "Conference Room", "Pantry", "Reception"],
};

const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-2 pt-4 pb-1">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">{title}</h3>
        <div className="flex-1 h-px bg-border" />
    </div>
);

export default function DetailsStep({ formData, setFormData, validationErrors }) {
    const [amenitiesList, setAmenitiesList] = useState([]);
    const [loadingAmenities, setLoadingAmenities] = useState(true);
    const [inlineErrors, setInlineErrors] = useState({});

    // Fetch amenities based on category
    useEffect(() => {
        const fetchAmenities = async () => {
            try {
                setLoadingAmenities(true);
                const response = await fetch("/api/categories/amenities");
                const data = await response.json();
                
                if (data.success && data.data?.amenities?.length > 0) {
                    const amenityNames = data.data.amenities.map(a => a.name);
                    setAmenitiesList(amenityNames);
                } else {
                    const fallback = FALLBACK_AMENITIES[formData.category] || FALLBACK_AMENITIES.flat;
                    setAmenitiesList(fallback);
                }
            } catch (err) {
                console.error("Error fetching amenities:", err);
                const fallback = FALLBACK_AMENITIES[formData.category] || FALLBACK_AMENITIES.flat;
                setAmenitiesList(fallback);
            } finally {
                setLoadingAmenities(false);
            }
        };

        if (formData.category) {
            fetchAmenities();
        }
    }, [formData.category]);

    const updateData = (updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleBlur = (fieldName, value) => {
        const error = validateFieldInline(fieldName, value, formData);
        setInlineErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const getError = (field) => validationErrors[field] || inlineErrors[field];

    const isRoom = formData.category === "room";
    const isFlat = formData.category === "flat";
    const isHouse = formData.category === "house";
    const isPG = formData.category === "pg";
    const isHostel = formData.category === "hostel";
    const isCommercial = formData.category === "commercial";
    
    const showResidentialFields = isFlat || isHouse;
    const showRoomFields = isRoom || isPG || isHostel;

    return (
        <div className="space-y-6 sm:space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Building size={22} className="text-primary" />
                Specifications & Amenities
            </h2>

            {/* Furnishing Status */}
            <div className="space-y-2">
                <Label className="text-foreground font-semibold text-xs sm:text-sm">Furnishing Status *</Label>
                <div className="grid grid-cols-3 gap-2">
                    {["unfurnished", "semi", "fully"].map((option) => (
                        <label 
                            key={option} 
                            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs sm:text-sm ${
                                formData.furnishing === option 
                                    ? "border-primary bg-primary/5 font-semibold" 
                                    : "border-border hover:border-primary/50"
                            }`}
                        >
                            <input
                                type="radio"
                                name="furnishing"
                                value={option}
                                checked={formData.furnishing === option}
                                onChange={(e) => updateData({ furnishing: e.target.value })}
                                className="w-3.5 h-3.5 accent-primary hidden"
                            />
                            <span className="capitalize">
                                {option === "semi" ? "Semi" : option === "fully" ? "Fully" : "Unfurnished"}
                            </span>
                        </label>
                    ))}
                </div>
                {validationErrors.furnishing && (
                    <p className="text-destructive text-[10px]">{validationErrors.furnishing}</p>
                )}
            </div>

            {/* Room Categories */}
            {showRoomFields && (
                <div className="space-y-4">
                    <SectionHeader title="Room Layout" />
                    
                    {/* Room Type */}
                    <div className="space-y-2">
                        <Label className="text-foreground font-semibold text-xs sm:text-sm">Room Type *</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {["single", "double", "triple"].map((type) => (
                                <label 
                                    key={type} 
                                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs sm:text-sm ${
                                        formData.roomType === type 
                                            ? "border-primary bg-primary/5 font-semibold" 
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.roomType === type}
                                        onChange={(e) => updateData({ roomType: e.target.value })}
                                        className="hidden"
                                    />
                                    <span className="capitalize">{type} Room</span>
                                </label>
                            ))}
                        </div>
                        {validationErrors.roomType && (
                            <p className="text-destructive text-[10px]">{validationErrors.roomType}</p>
                        )}
                    </div>

                    {/* Bathroom Type */}
                    <div className="space-y-2">
                        <Label className="text-foreground font-semibold text-xs sm:text-sm">Bathroom Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {["attached", "common"].map((type) => (
                                <label 
                                    key={type} 
                                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs sm:text-sm ${
                                        formData.bathroomType === type 
                                            ? "border-primary bg-primary/5 font-semibold" 
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.bathroomType === type}
                                        onChange={(e) => updateData({ bathroomType: e.target.value })}
                                        className="hidden"
                                    />
                                    <span className="capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Kitchen */}
                    <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.kitchenAvailable || false}
                            onChange={(e) => updateData({ kitchenAvailable: e.target.checked })}
                            className="w-4 h-4 rounded border-input accent-primary"
                        />
                        <span className="text-foreground font-semibold text-xs sm:text-sm">Kitchen Available</span>
                    </label>
                </div>
            )}

            {/* Flat / House Specifics */}
            {showResidentialFields && (
                <div className="space-y-4">
                    <SectionHeader title="Layout & Area" />
                    
                    {/* Area Size */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="builtUpArea" className="text-foreground font-semibold text-xs sm:text-sm">Built-up Area (sq ft) *</Label>
                            <Input
                                id="builtUpArea"
                                type="number"
                                placeholder="e.g., 1200"
                                value={formData.builtUpArea || ""}
                                onChange={(e) => updateData({ builtUpArea: e.target.value })}
                                className={`h-10 rounded-xl text-xs sm:text-sm ${getError("builtUpArea") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {getError("builtUpArea") && (
                                <p className="text-destructive text-[10px]">{getError("builtUpArea")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carpetArea" className="text-foreground font-semibold text-xs sm:text-sm">Carpet Area (sq ft)</Label>
                            <Input
                                id="carpetArea"
                                type="number"
                                placeholder="e.g., 1000"
                                value={formData.carpetArea || ""}
                                onChange={(e) => updateData({ carpetArea: e.target.value })}
                                className={`h-10 rounded-xl text-xs sm:text-sm ${getError("carpetArea") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {getError("carpetArea") && (
                                <p className="text-destructive text-[10px]">{getError("carpetArea")}</p>
                            )}
                        </div>
                    </div>

                    {/* Rooms, Bathrooms, Balconies */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Bedrooms */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-[10px] sm:text-xs">Bedrooms *</Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateData({ bedrooms: Math.max(0, parseInt(formData.bedrooms || 0) - 1).toString() })}
                                >
                                    <Minus size={12} />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.bedrooms || ""}
                                    onChange={(e) => updateData({ bedrooms: e.target.value })}
                                    className="text-center px-1 h-8 rounded-lg text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateData({ bedrooms: (parseInt(formData.bedrooms || 0) + 1).toString() })}
                                >
                                    <Plus size={12} />
                                </Button>
                            </div>
                            {validationErrors.bedrooms && (
                                <p className="text-destructive text-[10px]">{validationErrors.bedrooms}</p>
                            )}
                        </div>

                        {/* Bathrooms */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-[10px] sm:text-xs">Bathrooms</Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateData({ bathrooms: Math.max(0, parseInt(formData.bathrooms || 0) - 1).toString() })}
                                >
                                    <Minus size={12} />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.bathrooms || ""}
                                    onChange={(e) => updateData({ bathrooms: e.target.value })}
                                    className="text-center px-1 h-8 rounded-lg text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateData({ bathrooms: (parseInt(formData.bathrooms || 0) + 1).toString() })}
                                >
                                    <Plus size={12} />
                                </Button>
                            </div>
                        </div>

                        {/* Balconies */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-[10px] sm:text-xs">Balconies</Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateData({ balconies: Math.max(0, parseInt(formData.balconies || 0) - 1).toString() })}
                                >
                                    <Minus size={12} />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.balconies || ""}
                                    onChange={(e) => updateData({ balconies: e.target.value })}
                                    className="text-center px-1 h-8 rounded-lg text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateData({ balconies: (parseInt(formData.balconies || 0) + 1).toString() })}
                                >
                                    <Plus size={12} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <SectionHeader title="Floors & Detail" />

                    {/* Floor details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="floorNumber" className="text-foreground font-semibold text-xs sm:text-sm">Floor Number</Label>
                            <Input
                                id="floorNumber"
                                type="number"
                                value={formData.floorNumber || ""}
                                onChange={(e) => updateData({ floorNumber: e.target.value })}
                                className={`h-10 rounded-xl text-xs sm:text-sm ${getError("floorNumber") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {getError("floorNumber") && (
                                <p className="text-destructive text-[10px]">{getError("floorNumber")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="totalFloors" className="text-foreground font-semibold text-xs sm:text-sm">Total Floors</Label>
                            <Input
                                id="totalFloors"
                                type="number"
                                value={formData.totalFloors || ""}
                                onChange={(e) => updateData({ totalFloors: e.target.value })}
                                className="h-10 rounded-xl text-xs sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Direction and Age */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facingDirection" className="text-foreground font-semibold text-xs sm:text-sm">Facing</Label>
                            <select
                                id="facingDirection"
                                value={formData.facingDirection || ""}
                                onChange={(e) => updateData({ facingDirection: e.target.value })}
                                className="w-full px-3 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                            >
                                <option value="">Select</option>
                                {["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"].map((dir) => (
                                    <option key={dir} value={dir}>{dir}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyAge" className="text-foreground font-semibold text-xs sm:text-sm">Age</Label>
                            <select
                                id="propertyAge"
                                value={formData.propertyAge || ""}
                                onChange={(e) => updateData({ propertyAge: e.target.value })}
                                className="w-full px-3 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                            >
                                <option value="">Select</option>
                                {["New", "0-5 years", "5-10 years", "10+ years"].map((age) => (
                                    <option key={age} value={age}>{age}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Parking Option */}
                    <div className="space-y-2">
                        <Label className="text-foreground font-semibold text-xs sm:text-sm">Parking</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {["2-wheeler", "4-wheeler", "both", "none"].map((type) => (
                                <label 
                                    key={type} 
                                    className={`flex items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs ${
                                        formData.parking === type 
                                            ? "border-primary bg-primary/5 font-semibold" 
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.parking === type}
                                        onChange={(e) => updateData({ parking: e.target.value })}
                                        className="hidden"
                                    />
                                    <span className="capitalize">{type === "both" ? "Both" : type === "none" ? "None" : type.split("-")[0]}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Commercial specifics */}
            {isCommercial && (
                <div className="space-y-4">
                    <SectionHeader title="Commercial Specifications" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="builtUpAreaComm" className="text-foreground font-semibold text-xs sm:text-sm">Built-up Area (sq ft) *</Label>
                            <Input
                                id="builtUpAreaComm"
                                type="number"
                                value={formData.builtUpArea || ""}
                                onChange={(e) => updateData({ builtUpArea: e.target.value })}
                                className={`h-10 rounded-xl text-xs sm:text-sm ${validationErrors.builtUpArea ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {validationErrors.builtUpArea && (
                                <p className="text-destructive text-[10px]">{validationErrors.builtUpArea}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carpetAreaComm" className="text-foreground font-semibold text-xs sm:text-sm">Carpet Area (sq ft)</Label>
                            <Input
                                id="carpetAreaComm"
                                type="number"
                                value={formData.carpetArea || ""}
                                onChange={(e) => updateData({ carpetArea: e.target.value })}
                                className={`h-10 rounded-xl text-xs sm:text-sm ${validationErrors.carpetArea ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {validationErrors.carpetArea && (
                                <p className="text-destructive text-[10px]">{validationErrors.carpetArea}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Washroom */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-xs sm:text-sm">Washrooms</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["private", "shared"].map((type) => (
                                    <label 
                                        key={type} 
                                        className={`flex items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs ${
                                            formData.washroom === type 
                                                ? "border-primary bg-primary/5 font-semibold" 
                                                : "border-border hover:border-primary/50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            value={type}
                                            checked={formData.washroom === type}
                                            onChange={(e) => updateData({ washroom: e.target.value })}
                                            className="hidden"
                                        />
                                        <span className="capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Frontage */}
                        <div className="space-y-2">
                            <Label htmlFor="frontage" className="text-foreground font-semibold text-xs sm:text-sm">Frontage (meters)</Label>
                            <Input
                                id="frontage"
                                type="number"
                                value={formData.frontage || ""}
                                onChange={(e) => updateData({ frontage: e.target.value })}
                                className="h-10 rounded-xl text-xs sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Infrastructure Options */}
            <div className="space-y-4">
                <SectionHeader title="Infrastructure" />
                <div className="grid grid-cols-2 gap-4">
                    {/* Water Supply */}
                    <div className="space-y-2">
                        <Label htmlFor="waterSupply" className="text-foreground font-semibold text-xs sm:text-sm">Water Supply</Label>
                        <select
                            id="waterSupply"
                            value={formData.waterSupply || ""}
                            onChange={(e) => updateData({ waterSupply: e.target.value })}
                            className="w-full px-3 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                        >
                            <option value="">Select</option>
                            {WATER_SUPPLY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{WATER_SUPPLY_LABELS[opt]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Power Backup */}
                    <div className="space-y-2">
                        <Label htmlFor="powerBackup" className="text-foreground font-semibold text-xs sm:text-sm">Power Backup</Label>
                        <select
                            id="powerBackup"
                            value={formData.powerBackup || ""}
                            onChange={(e) => updateData({ powerBackup: e.target.value })}
                            className="w-full px-3 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                        >
                            <option value="">Select</option>
                            {POWER_BACKUP_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{POWER_BACKUP_LABELS[opt]}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Gated community */}
                {showResidentialFields && (
                    <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.gatedCommunity || false}
                            onChange={(e) => updateData({ gatedCommunity: e.target.checked })}
                            className="w-4 h-4 rounded border-input accent-primary"
                        />
                        <span className="text-foreground font-semibold text-xs sm:text-sm">Gated Community / Society</span>
                    </label>
                )}
            </div>

            {/* Amenities Checklist */}
            <div className="space-y-4 pt-2">
                <SectionHeader title="Amenities" />
                {loadingAmenities ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {amenitiesList.map((amenity) => {
                            const isSelected = formData.amenities.includes(amenity);
                            return (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => toggleAmenity(amenity)}
                                    className={`p-2.5 rounded-xl border-2 transition-all text-left text-xs flex items-center justify-between gap-1.5 active:scale-98 ${
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                                            : "border-border bg-card text-foreground hover:border-primary/50"
                                    }`}
                                >
                                    <span className="truncate">{amenity}</span>
                                    {isSelected && <Check size={14} className="text-primary shrink-0 animate-scale-in" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Contact details */}
            <div className="space-y-4 pt-2">
                <SectionHeader title="Your Contact Details" />

                {/* Owner Name */}
                <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-foreground font-semibold text-xs sm:text-sm">Full Name *</Label>
                    <Input
                        id="ownerName"
                        placeholder="Your full name"
                        value={formData.ownerName || ""}
                        onChange={(e) => updateData({ ownerName: e.target.value })}
                        className={`h-10 rounded-xl text-xs sm:text-sm ${getError("ownerName") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {getError("ownerName") && (
                        <p className="text-destructive text-[10px]">{getError("ownerName")}</p>
                    )}
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="ownerPhone" className="text-foreground font-semibold text-xs sm:text-sm">Phone Number *</Label>
                        <div className="flex gap-2">
                            <span className="flex items-center justify-center px-3 bg-muted border border-input rounded-xl text-xs text-muted-foreground font-medium h-10">
                                +91
                            </span>
                            <Input
                                id="ownerPhone"
                                placeholder="98765 43210"
                                value={formData.ownerPhone || ""}
                                onChange={(e) => updateData({ ownerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                onBlur={(e) => handleBlur("ownerPhone", e.target.value)}
                                inputMode="numeric"
                                maxLength={10}
                                className={`flex-1 h-10 rounded-xl text-xs sm:text-sm ${getError("ownerPhone") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                        </div>
                        {getError("ownerPhone") && (
                            <p className="text-destructive text-[10px]">{getError("ownerPhone")}</p>
                        )}
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                        <Label htmlFor="ownerEmail" className="text-foreground font-semibold text-xs sm:text-sm">Email Address *</Label>
                        <Input
                            id="ownerEmail"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.ownerEmail || ""}
                            onChange={(e) => updateData({ ownerEmail: e.target.value })}
                            onBlur={(e) => handleBlur("ownerEmail", e.target.value)}
                            className={`h-10 rounded-xl text-xs sm:text-sm ${getError("ownerEmail") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {getError("ownerEmail") && (
                            <p className="text-destructive text-[10px]">{getError("ownerEmail")}</p>
                        )}
                    </div>
                </div>

                {/* Role Types selection */}
                <div className="space-y-2">
                    <Label className="text-foreground font-semibold text-xs sm:text-sm">You are *</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {OWNER_TYPES.map((type) => (
                            <label 
                                key={type} 
                                className={`flex items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs ${
                                    formData.ownerType === type 
                                        ? "border-primary bg-primary/5 font-bold shadow-sm" 
                                        : "border-border hover:border-primary/50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    value={type}
                                    checked={formData.ownerType === type}
                                    onChange={(e) => updateData({ ownerType: e.target.value })}
                                    className="hidden"
                                />
                                <span>{OWNER_TYPE_LABELS[type]}</span>
                            </label>
                        ))}
                    </div>
                    {getError("ownerType") && (
                        <p className="text-destructive text-[10px]">{getError("ownerType")}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
