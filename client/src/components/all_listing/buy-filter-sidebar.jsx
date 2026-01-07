import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { ChevronDown, ShieldCheck, Check, SlidersHorizontal, X, RotateCcw, Banknote, Building2, Bed, Wallet, Calendar, Wifi } from "lucide-react";
import { 
    FILTER_PROPERTY_TYPE_OPTIONS, 
} from "../../utils/propertyTypeStandardization";
import { POSSESSION_STATUS_LABELS } from "@shared/propertyTypes";

/**
 * Buy-specific filter sidebar component
 * Displays filters relevant to properties for sale: city, price range, possession status, loan available
 */
export function BuyFilterSidebar({ filters, onFilterChange, hideHeader = false, compact = false }) {
    const [expandedSections, setExpandedSections] = useState({
        propertyType: true,
        bedrooms: true,
        price: true,
        possessionStatus: true,
        loanAvailable: true,
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

    const handlePossessionStatusChange = (value) => {
        onFilterChange("possessionStatus", value === filters.possessionStatus ? "" : value);
    };

    const handleLoanAvailableChange = (value) => {
        onFilterChange("loanAvailable", value);
    };

    const handlePriceChange = (type, value) => {
        if (value === "" || value === null || value === undefined) {
            const newPriceRange = {
                ...filters.priceRange,
                [type]: type === "min" ? 0 : 50000000
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
        
        if (type === "min" && newPriceRange.max < 50000000 && numValue > newPriceRange.max) {
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
        if (filters.priceRange.min > 0 || filters.priceRange.max < 50000000) count++;
        if (filters.bedrooms.length > 0) count++;
        if (filters.possessionStatus) count++;
        if (filters.loanAvailable !== null && filters.loanAvailable !== undefined) count++;
        if (filters.amenities.length > 0) count++;
        if (filters.verifiedOnly) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    // Format price for display (in Lakhs/Crores)
    const formatPrice = (price) => {
        if (price >= 10000000) {
            return `${(price / 10000000).toFixed(1)}Cr`;
        } else if (price >= 100000) {
            return `${(price / 100000).toFixed(0)}L`;
        }
        return `₹${price.toLocaleString('en-IN')}`;
    };

    // Section icons mapping
    const sectionIcons = {
        propertyType: Building2,
        bedrooms: Bed,
        price: Wallet,
        possessionStatus: Calendar,
        loanAvailable: Banknote,
        amenities: Wifi,
    };

    const FilterSection = ({ id, title, children, badge }) => {
        const isExpanded = expandedSections[id];
        const Icon = sectionIcons[id];
        
        return (
            <div className="group">
                <button
                    onClick={() => toggleSection(id)}
                    className={`flex items-center justify-between w-full text-left rounded-xl transition-all duration-200 ${
                        compact ? 'py-3 px-1' : 'py-3.5 px-3 hover:bg-muted/50'
                    }`}
                    aria-expanded={isExpanded}
                    aria-controls={`${id}-content`}
                >
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isExpanded ? 'bg-emerald-500/10' : 'bg-muted/50 group-hover:bg-emerald-500/5'
                            }`}>
                                <Icon className={`w-4 h-4 transition-colors ${
                                    isExpanded ? 'text-emerald-600' : 'text-muted-foreground group-hover:text-emerald-600/70'
                                }`} />
                            </div>
                        )}
                        <span className={`text-sm font-semibold transition-colors ${
                            isExpanded ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        }`}>
                            {title}
                        </span>
                        {badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-md">
                                {badge}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-all duration-300 ${
                            isExpanded ? "rotate-180 text-emerald-600" : ""
                        }`}
                    />
                </button>
                
                <div
                    id={`${id}-content`}
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                        isExpanded ? `max-h-[500px] opacity-100 ${compact ? 'pb-4' : 'pb-5 px-3'}` : "max-h-0 opacity-0"
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
            className={`w-full lg:w-80 overflow-hidden ${
                compact 
                    ? 'bg-transparent' 
                    : 'bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg shadow-black/5'
            }`}
            role="complementary"
            aria-label="Buy property filters"
        >
            {/* Header */}
            {!hideHeader && (
                <div className="relative overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
                    
                    <div className="relative flex items-center justify-between p-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <SlidersHorizontal className="w-5 h-5 text-white" />
                                </div>
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="font-bold text-foreground">Buy Filters</h2>
                                <p className="text-xs text-muted-foreground">
                                    {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : 'Refine your search'}
                                </p>
                            </div>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-all px-3 py-2 rounded-lg hover:bg-destructive/10 group"
                                aria-label="Clear all filters"
                            >
                                <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-360deg] transition-transform duration-500" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Filter Sections */}
            <div className={`${compact ? 'p-3' : 'p-4'} space-y-1 ${compact ? '' : 'max-h-[calc(100vh-12rem)] overflow-y-auto'}`}>
                
                {/* Property Type */}
                <FilterSection 
                    id="propertyType" 
                    title="Property Type"
                    badge={filters.propertyType ? "1" : null}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {FILTER_PROPERTY_TYPE_OPTIONS.map((option) => {
                            const isSelected = filters.propertyType === option.value;
                            return (
                                <label
                                    key={option.value}
                                    className={`
                                        relative flex items-center justify-center px-3 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200
                                        ${isSelected
                                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
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
                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Bedrooms (BHK) */}
                <FilterSection 
                    id="bedrooms" 
                    title="BHK"
                    badge={filters.bedrooms.length > 0 ? filters.bedrooms.length : null}
                >
                    <div className="flex flex-wrap gap-2">
                        {["1", "2", "3", "4", "5+"].map((bed) => {
                            const isSelected = filters.bedrooms.includes(bed);
                            return (
                                <label
                                    key={bed}
                                    className={`
                                        flex items-center justify-center w-14 h-14 rounded-xl cursor-pointer text-sm font-bold transition-all duration-200
                                        ${isSelected
                                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]"
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

                {/* Price Range for Buy */}
                <FilterSection 
                    id="price" 
                    title="Price Range"
                    badge={(filters.priceRange.min > 0 || filters.priceRange.max < 50000000) ? "1" : null}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label htmlFor="price-min" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Min
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                                    <input
                                        id="price-min"
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={filters.priceRange.min || ""}
                                        onChange={(e) => handlePriceChange("min", e.target.value)}
                                        className="w-full pl-7 pr-3 py-3 bg-muted/30 border-2 border-transparent rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-emerald-500/50 focus:shadow-lg focus:shadow-emerald-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="price-max" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Max
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                                    <input
                                        id="price-max"
                                        type="number"
                                        placeholder="Any"
                                        min="0"
                                        value={filters.priceRange.max === 50000000 ? "" : filters.priceRange.max || ""}
                                        onChange={(e) => handlePriceChange("max", e.target.value)}
                                        className="w-full pl-7 pr-3 py-3 bg-muted/30 border-2 border-transparent rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-emerald-500/50 focus:shadow-lg focus:shadow-emerald-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Price Buttons */}
                        <div className="flex flex-wrap gap-1.5">
                            {[5000000, 10000000, 20000000, 50000000].map((price) => {
                                const isSelected = filters.priceRange.max === price;
                                return (
                                    <button
                                        key={price}
                                        onClick={() => handlePriceChange("max", price)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                            isSelected
                                                ? "bg-emerald-500 text-white shadow-md"
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                    >
                                        ≤₹{formatPrice(price)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </FilterSection>

                {/* Possession Status */}
                <FilterSection 
                    id="possessionStatus" 
                    title="Possession"
                    badge={filters.possessionStatus ? "1" : null}
                >
                    <div className="space-y-2">
                        {Object.entries(POSSESSION_STATUS_LABELS).map(([value, label]) => {
                            const isSelected = filters.possessionStatus === value;
                            return (
                                <label
                                    key={value}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                                        ${isSelected
                                            ? "bg-emerald-500/10 ring-2 ring-emerald-500/30"
                                            : "bg-muted/30 hover:bg-muted/50"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                        ${isSelected 
                                            ? "bg-emerald-500 border-emerald-500" 
                                            : "border-muted-foreground/30"
                                        }
                                    `}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="possessionStatus"
                                        value={value}
                                        checked={isSelected}
                                        onChange={() => handlePossessionStatusChange(value)}
                                        className="sr-only"
                                    />
                                    <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
                                        {label}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Loan Available */}
                <FilterSection 
                    id="loanAvailable" 
                    title="Loan Available"
                    badge={(filters.loanAvailable !== null && filters.loanAvailable !== undefined) ? "1" : null}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: true, label: "Yes" },
                            { value: false, label: "No" }
                        ].map((option) => {
                            const isSelected = filters.loanAvailable === option.value;
                            return (
                                <label
                                    key={String(option.value)}
                                    className={`
                                        flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200
                                        ${isSelected
                                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="loanAvailable"
                                        checked={isSelected}
                                        onChange={() => handleLoanAvailableChange(option.value)}
                                        className="sr-only"
                                    />
                                    <Banknote className="w-4 h-4" />
                                    {option.label}
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Amenities */}
                <FilterSection 
                    id="amenities" 
                    title="Amenities"
                    badge={filters.amenities.length > 0 ? filters.amenities.length : null}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {["Parking", "Garden", "Swimming Pool", "Gym", "Clubhouse", "Security", "Power Backup", "Lift"].map((amenity) => {
                            const isSelected = filters.amenities.includes(amenity);
                            return (
                                <label 
                                    key={amenity} 
                                    className={`
                                        flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                                        ${isSelected 
                                            ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" 
                                            : "bg-muted/30 hover:bg-muted/50"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                                        ${isSelected 
                                            ? "bg-emerald-500 border-emerald-500" 
                                            : "border-muted-foreground/30"
                                        }
                                    `}>
                                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleAmenityChange(amenity)}
                                        className="sr-only"
                                    />
                                    <span className={`text-sm font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                                        {amenity}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Verified Toggle */}
                <div className="pt-3">
                    <label className={`
                        flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
                        ${filters.verifiedOnly 
                            ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 ring-2 ring-emerald-500/30' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }
                    `}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                filters.verifiedOnly 
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25' 
                                    : 'bg-muted'
                            }`}>
                                <ShieldCheck className={`w-5 h-5 ${filters.verifiedOnly ? 'text-white' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                                <span className={`text-sm font-bold block ${filters.verifiedOnly ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
                                    Verified Only
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Trusted & verified listings
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
                            <div className={`w-12 h-7 rounded-full transition-all duration-300 ${
                                filters.verifiedOnly ? 'bg-emerald-500' : 'bg-muted'
                            }`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                                    filters.verifiedOnly ? "left-6" : "left-1"
                                }`} />
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Footer - Clear All */}
            {activeFilterCount > 0 && !compact && (
                <div className="p-4 border-t border-border/50 bg-muted/20">
                    <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        className="w-full h-12 border-2 border-dashed border-muted-foreground/20 hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive rounded-xl font-semibold transition-all group"
                    >
                        <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Clear all filters ({activeFilterCount})
                    </Button>
                </div>
            )}
        </aside>
    );
}
