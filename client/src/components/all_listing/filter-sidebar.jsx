import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { ChevronDown, ShieldCheck, Check, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { 
    FILTER_PROPERTY_TYPE_OPTIONS, 
} from "../../utils/propertyTypeStandardization";

export function FilterSidebar({ filters, onFilterChange }) {
    const [expandedSections, setExpandedSections] = useState({
        propertyType: true,
        bedrooms: true,
        price: true,
        furnishing: true,
        amenities: false,
        verified: true,
    });

    const sidebarRef = useRef(null);

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handlePropertyTypeChange = (value) => {
        onFilterChange("propertyType", value);
    };

    const handleBedroomChange = (bed) => {
        const newBedrooms = filters.bedrooms.includes(bed)
            ? filters.bedrooms.filter((b) => b !== bed)
            : [...filters.bedrooms, bed];
        onFilterChange("bedrooms", newBedrooms);
    };

    const handleAmenityChange = (amenity) => {
        const newAmenities = filters.amenities.includes(amenity)
            ? filters.amenities.filter((a) => a !== amenity)
            : [...filters.amenities, amenity];
        onFilterChange("amenities", newAmenities);
    };

    const handleFurnishingChange = (value) => {
        const currentFurnishing = filters.furnishing || [];
        const newFurnishing = currentFurnishing.includes(value)
            ? currentFurnishing.filter((f) => f !== value)
            : [...currentFurnishing, value];
        onFilterChange("furnishing", newFurnishing);
    };

    const handlePriceChange = (type, value) => {
        if (value === "" || value === null || value === undefined) {
            const newPriceRange = {
                ...filters.priceRange,
                [type]: type === "min" ? 0 : 100000
            };
            onFilterChange("priceRange", newPriceRange);
            return;
        }

        const numValue = parseInt(String(value), 10);
        
        if (isNaN(numValue) || numValue < 0) {
            return;
        }

        const newPriceRange = {
            ...filters.priceRange,
            [type]: numValue
        };
        
        if (type === "min" && newPriceRange.max < 100000 && numValue > newPriceRange.max) {
            return;
        }
        if (type === "max" && newPriceRange.min > 0 && numValue < newPriceRange.min) {
            return;
        }
        
        onFilterChange("priceRange", newPriceRange);
    };

    const handleVerifiedToggle = (checked) => {
        onFilterChange("verifiedOnly", checked);
    };

    const handleClearFilters = () => {
        onFilterChange("clearAll", null);
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.propertyType) count++;
        if (filters.priceRange.min > 0 || filters.priceRange.max < 100000) count++;
        if (filters.bedrooms.length > 0) count++;
        if ((filters.furnishing || []).length > 0) count++;
        if (filters.amenities.length > 0) count++;
        if (filters.verifiedOnly) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    const FilterSection = ({ id, title, children, defaultExpanded = true }) => {
        const isExpanded = expandedSections[id];
        
        return (
            <div className="border-b border-border last:border-0">
                <button
                    onClick={() => toggleSection(id)}
                    className="flex items-center justify-between w-full py-4 text-left group"
                    aria-expanded={isExpanded}
                    aria-controls={`${id}-content`}
                >
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {title}
                    </span>
                    <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                        }`}
                    />
                </button>
                
                <div
                    id={`${id}-content`}
                    className={`overflow-hidden transition-all duration-200 ${
                        isExpanded ? "max-h-[500px] pb-4" : "max-h-0"
                    }`}
                >
                    {children}
                </div>
            </div>
        );
    };

    return (
        <aside 
            ref={sidebarRef}
            className="w-full lg:w-80 bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
            role="complementary"
            aria-label="Property filters"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground">Filters</h2>
                        {activeFilterCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {activeFilterCount} active
                            </p>
                        )}
                    </div>
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
                        aria-label="Clear all filters"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>
                )}
            </div>

            {/* Filter Sections */}
            <div className="p-5 space-y-0 max-h-[calc(100vh-12rem)] overflow-y-auto">
                
                {/* Property Type */}
                <FilterSection id="propertyType" title="Property Type">
                    <div className="grid grid-cols-2 gap-2">
                        {FILTER_PROPERTY_TYPE_OPTIONS.map((option) => {
                            const isSelected = filters.propertyType === option.value;
                            return (
                                <label
                                    key={option.value}
                                    className={`
                                        relative flex items-center justify-center px-3 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all duration-200
                                        ${isSelected
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                                        }
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="propertyType"
                                        value={option.value}
                                        checked={isSelected}
                                        onChange={(e) => handlePropertyTypeChange(e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && (
                                        <Check className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-primary" />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Bedrooms */}
                <FilterSection id="bedrooms" title="Bedrooms">
                    <div className="flex flex-wrap gap-2">
                        {["1", "2", "3", "4", "5+"].map((bed) => {
                            const isSelected = filters.bedrooms.includes(bed);
                            return (
                                <label
                                    key={bed}
                                    className={`
                                        flex items-center justify-center w-12 h-12 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-all duration-200
                                        ${isSelected
                                            ? "bg-primary border-primary text-primary-foreground shadow-md"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/30"
                                        }
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleBedroomChange(bed)}
                                        className="sr-only"
                                    />
                                    {bed}
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Price Range */}
                <FilterSection id="price" title="Price Range">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor="price-min" className="text-xs font-medium text-muted-foreground">
                                    Minimum
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                    <input
                                        id="price-min"
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={filters.priceRange.min || ""}
                                        onChange={(e) => handlePriceChange("min", e.target.value)}
                                        className="w-full pl-7 pr-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="price-max" className="text-xs font-medium text-muted-foreground">
                                    Maximum
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                    <input
                                        id="price-max"
                                        type="number"
                                        placeholder="Any"
                                        min="0"
                                        value={filters.priceRange.max === 100000 ? "" : filters.priceRange.max || ""}
                                        onChange={(e) => handlePriceChange("max", e.target.value)}
                                        className="w-full pl-7 pr-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Price Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {[10000, 20000, 35000, 50000].map((price) => (
                                <button
                                    key={price}
                                    onClick={() => handlePriceChange("max", price)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        filters.priceRange.max === price
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                                >
                                    Under ₹{price.toLocaleString('en-IN')}
                                </button>
                            ))}
                        </div>
                    </div>
                </FilterSection>

                {/* Furnishing */}
                <FilterSection id="furnishing" title="Furnishing">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: "unfurnished", label: "Unfurnished" },
                            { value: "semi", label: "Semi-Furnished" },
                            { value: "fully", label: "Fully Furnished" }
                        ].map((option) => {
                            const isSelected = (filters.furnishing || []).includes(option.value);
                            return (
                                <label
                                    key={option.value}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all duration-200
                                        ${isSelected
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/30"
                                        }
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleFurnishingChange(option.value)}
                                        className="sr-only"
                                    />
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                    {option.label}
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Amenities */}
                <FilterSection id="amenities" title="Amenities">
                    <div className="grid grid-cols-2 gap-2">
                        {["Parking", "Wifi", "Pet-friendly", "Gym", "Pool", "Laundry", "AC", "Balcony"].map((amenity) => {
                            const isSelected = filters.amenities.includes(amenity);
                            return (
                                <label 
                                    key={amenity} 
                                    className={`
                                        flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                                        ${isSelected 
                                            ? "bg-primary/10 text-primary" 
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                                        ${isSelected 
                                            ? "bg-primary border-primary" 
                                            : "border-border"
                                        }
                                    `}>
                                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleAmenityChange(amenity)}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-medium">{amenity}</span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Verified Toggle */}
                <div className="pt-4">
                    <label className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl cursor-pointer hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 block">
                                    Verified Only
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Show trusted listings
                                </span>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={filters.verifiedOnly}
                                onChange={(e) => handleVerifiedToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-emerald-500 transition-colors">
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                                    filters.verifiedOnly ? "translate-x-5" : ""
                                }`} />
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Footer - Clear All */}
            {activeFilterCount > 0 && (
                <div className="p-4 border-t border-border bg-muted/30">
                    <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        className="w-full h-11 border-dashed border-border hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive rounded-xl font-medium transition-all"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Clear all filters ({activeFilterCount})
                    </Button>
                </div>
            )}
        </aside>
    );
}
