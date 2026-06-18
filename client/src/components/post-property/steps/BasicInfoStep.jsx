import { useState, useEffect } from "react";
import { Home, ShoppingBag, Building2, Users, Hotel, ShoppingCart, Loader2, Lightbulb } from "lucide-react";
import { LISTING_TYPES } from "@shared/propertyTypes";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";

const ICON_MAP = {
    Home: Home,
    Building2: Building2,
    Users: Users,
    Hotel: Hotel,
    ShoppingCart: ShoppingCart
};

const FALLBACK_CATEGORIES = [
    { id: "room", label: "Room", description: "Single or shared rooms", icon: Home },
    { id: "flat", label: "Flat / Apartment", description: "1BHK, 2BHK, 3BHK flats", icon: Building2 },
    { id: "house", label: "House", description: "Independent house or villa", icon: Home },
    { id: "pg", label: "PG (Paying Guest)", description: "Paying guest accommodation", icon: Users },
    { id: "hostel", label: "Hostel", description: "Hostel rooms and beds", icon: Hotel },
    { id: "commercial", label: "Commercial", description: "Shop, Office, Warehouse", icon: ShoppingCart },
];

const LISTING_OPTIONS = [
    {
        id: LISTING_TYPES.RENT,
        label: "Rent Property",
        description: "List your property for monthly rent",
        icon: Home,
        features: ["Monthly rent pricing", "Security deposit", "Tenant preferences"]
    },
    {
        id: LISTING_TYPES.BUY,
        label: "Sell Property",
        description: "List your property for sale",
        icon: ShoppingBag,
        features: ["Selling price", "Price per sqft", "Possession status"]
    }
];

const PROPERTY_TYPES = {
    room: ["Single Room", "Double Room", "Triple Room", "Dormitory"],
    flat: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "Villa"],
    house: ["Independent House", "Villa", "Bungalow", "Farmhouse"],
    pg: ["Single Sharing", "Double Sharing", "Triple Sharing", "Four Sharing"],
    hostel: ["Single Room", "Double Sharing", "Dormitory"],
    commercial: ["Shop", "Office", "Co-working Space", "Hall", "Warehouse"],
};

export default function BasicInfoStep({ formData, setFormData, validationErrors }) {
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories");
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    const mapped = data.data.map(cat => ({
                        id: cat.slug,
                        label: cat.name,
                        description: cat.description || "",
                        icon: ICON_MAP[cat.icon] || Home
                    }));
                    setCategories(mapped);
                } else {
                    setCategories(FALLBACK_CATEGORIES);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories(FALLBACK_CATEGORIES);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const types = PROPERTY_TYPES[formData.category] || [];
    const descLength = (formData.description || "").length;

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Listing Type Option */}
            <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">What would you like to do? *</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LISTING_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = formData.listingType === option.id;

                        return (
                            <button
                                type="button"
                                key={option.id}
                                onClick={() => setFormData({ ...formData, listingType: option.id })}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 active:scale-98 ${
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-md"
                                        : "border-border bg-card hover:border-primary/50"
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-sm sm:text-base ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {option.label}
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">{option.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {validationErrors.listingType && (
                    <p className="text-destructive text-xs">{validationErrors.listingType}</p>
                )}
            </div>

            {/* Category Option */}
            <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">What are you listing? *</h2>
                {loadingCategories ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const isSelected = formData.category === category.id;

                            return (
                                <button
                                    type="button"
                                    key={category.id}
                                    onClick={() => setFormData({ ...formData, category: category.id })}
                                    className={`p-3.5 rounded-xl border-2 transition-all text-left active:scale-98 ${
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border bg-card hover:border-primary/50"
                                    }`}
                                >
                                    <Icon
                                        size={22}
                                        className={`${isSelected ? "text-primary" : "text-muted-foreground"} mb-1.5`}
                                    />
                                    <h4 className={`font-semibold text-xs sm:text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {category.label}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">{category.description}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
                {validationErrors.category && (
                    <p className="text-destructive text-xs">{validationErrors.category}</p>
                )}
            </div>

            {/* Basic Property Form Fields - Visible after Category selection */}
            {formData.category && (
                <div className="space-y-5 border-t border-border/60 pt-6 animate-fade-in">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Property Details</h2>
                    
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground font-semibold text-xs sm:text-sm">Property Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Spacious 2 BHK Apartment in Downtown"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`text-xs sm:text-sm rounded-xl h-10 ${validationErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            maxLength={120}
                        />
                        {(!formData.title || formData.title.length < 10) && (
                            <div className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                                <Lightbulb size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                    <strong>Pro tip:</strong> Titles with size and location perform 40% better.
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-[10px]">
                            {validationErrors.title && (
                                <p className="text-destructive">{validationErrors.title}</p>
                            )}
                            <span className="text-muted-foreground ml-auto">
                                {formData.title?.length || 0}/120
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-foreground font-semibold text-xs sm:text-sm">
                            Description <span className="text-muted-foreground font-normal">(Recommended)</span>
                        </Label>
                        <textarea
                            id="description"
                            placeholder="Describe rooms, local landmarks, connectivity, and advantages..."
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            maxLength={2000}
                            className="w-full px-3.5 py-2.5 border border-input rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[90px]"
                        />
                        <div className="flex justify-between items-center text-[10px]">
                            {descLength > 0 && descLength < 50 && (
                                <p className="text-amber-500">Descriptions above 50 chars rank higher.</p>
                            )}
                            <span className="text-muted-foreground ml-auto">
                                {descLength}/2000
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Property SubType */}
                        <div className="space-y-2">
                            <Label htmlFor="propertyType" className="text-foreground font-semibold text-xs sm:text-sm">Property Type *</Label>
                            <select
                                id="propertyType"
                                value={formData.propertyType}
                                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                                className={`w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                                    validationErrors.propertyType ? "border-destructive" : "border-input"
                                }`}
                            >
                                <option value="">Select subtype</option>
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.propertyType && (
                                <p className="text-destructive text-[10px]">{validationErrors.propertyType}</p>
                            )}
                        </div>

                        {/* Available From */}
                        <div className="space-y-2">
                            <Label htmlFor="availableFrom" className="text-foreground font-semibold text-xs sm:text-sm">Available From *</Label>
                            <input
                                id="availableFrom"
                                type="date"
                                value={formData.availableFrom}
                                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                                min={new Date().toISOString().split("T")[0]}
                                className={`w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                                    validationErrors.availableFrom ? "border-destructive" : "border-input"
                                }`}
                            />
                            {validationErrors.availableFrom && (
                                <p className="text-destructive text-[10px]">{validationErrors.availableFrom}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
