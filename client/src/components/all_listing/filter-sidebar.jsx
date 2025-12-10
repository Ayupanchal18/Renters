import { useState } from "react";
import { Button } from "../ui/button"; // Assuming shadcn/ui button
import { ChevronDown, ShieldCheck, Check, Filter } from "lucide-react";

export function FilterSidebar({ filters, onFilterChange }) {
    // --- Logic remains exactly the same ---
    const [expandedSections, setExpandedSections] = useState({
        propertyType: true,
        bedrooms: true,
        price: true,
        amenities: true,
        verified: true,
    });

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handlePropertyTypeChange = (value) => {
        onFilterChange({ ...filters, propertyType: value });
    };

    const handleBedroomChange = (bed) => {
        const newBeds = filters.beds.includes(bed)
            ? filters.beds.filter((b) => b !== bed)
            : [...filters.beds, bed];
        onFilterChange({ ...filters, beds: newBeds });
    };

    const handleAmenityChange = (amenity) => {
        const newAmenities = filters.amenities.includes(amenity)
            ? filters.amenities.filter((a) => a !== amenity)
            : [...filters.amenities, amenity];

        onFilterChange({ ...filters, amenities: newAmenities });
    };

    const handlePriceChange = (type, value) => {
        onFilterChange({
            ...filters,
            [type === "min" ? "minPrice" : "maxPrice"]: value,
        });
    };

    const handleClearFilters = () => {
        onFilterChange({
            city: "",
            propertyType: "",
            minPrice: "",
            maxPrice: "",
            beds: [],
            amenities: [],
            verifiedOnly: false,
        });
    };

    // --- Updated JSX Design ---
    return (
        <aside className="w-80 sticky top-24 h-fit bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">

            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h2>
            </div>

            {/* Property Type - Card Select Style */}
            <div className="py-3 border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
                <button
                    onClick={() => toggleSection("propertyType")}
                    className="flex items-center justify-between w-full mb-4 font-medium text-slate-900 dark:text-slate-100 group"
                >
                    Property Type
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200${expandedSections.propertyType ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {expandedSections.propertyType && (
                    <div className="grid grid-cols-2 gap-3">
                        {["Room", "House", "Flat", "Hall"].map((type) => {
                            const isSelected = filters.propertyType === type.toLowerCase();
                            return (
                                <label
                                    key={type}
                                    className={`
                                        relative flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer text-sm font-medium transition-all duration-200
                                       ${isSelected
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="propertyType"
                                        value={type.toLowerCase()}
                                        checked={isSelected}
                                        onChange={(e) => handlePropertyTypeChange(e.target.value)}
                                        className="sr-only" // Hide default radio
                                    />
                                    {type}
                                    {isSelected && <Check className="w-3.5 h-3.5 absolute top-2 right-2 text-indigo-600" />}
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bedrooms - Pill/Tag Style */}
            <div className="py-3 border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
                <button
                    onClick={() => toggleSection("bedrooms")}
                    className="flex items-center justify-between w-full mb-4 font-medium text-slate-900 dark:text-slate-100"
                >
                    Bedrooms
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200${expandedSections.bedrooms ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {expandedSections.bedrooms && (
                    <div className="flex flex-wrap gap-2">
                        {["1", "2", "3", "4", "5+"].map((bed) => {
                            const isSelected = filters.beds.includes(bed);
                            return (
                                <label
                                    key={bed}
                                    className={`
                                        flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer text-sm transition-all duration-200
                                       ${isSelected
                                            ? "bg-slate-900 border-slate-900 text-white shadow-md"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
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
                        <span className="text-xs self-center text-slate-400 ml-1">Beds</span>
                    </div>
                )}
            </div>

            {/* Price Range - Side by Side Inputs */}
            <div className="py-3 border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
                <button
                    onClick={() => toggleSection("price")}
                    className="flex items-center justify-between w-full mb-4 font-medium text-slate-900 dark:text-slate-100"
                >
                    Price Range
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200${expandedSections.price ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {expandedSections.price && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">Min</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.minPrice}
                                    onChange={(e) => handlePriceChange("min", e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">Max</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                <input
                                    type="number"
                                    placeholder="Any"
                                    value={filters.maxPrice}
                                    onChange={(e) => handlePriceChange("max", e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Amenities - Clean List with accent color */}
            <div className="py-3 border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
                <button
                    onClick={() => toggleSection("amenities")}
                    className="flex items-center justify-between w-full mb-4 font-medium text-slate-900 dark:text-slate-100"
                >
                    Amenities
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200${expandedSections.amenities ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {expandedSections.amenities && (
                    <div className="space-y-3">
                        {["Furnished", "Parking", "Wifi", "Pet-friendly"].map((amenity) => (
                            <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filters.amenities.includes(amenity)}
                                        onChange={() => handleAmenityChange(amenity)}
                                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all"
                                    />
                                    <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                    {amenity}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Verified Toggle - Highlighted */}
            <div className="py-4">
                <label className="flex items-center justify-between p-3 border border-indigo-100 bg-indigo-50/50 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-md text-indigo-600 shadow-sm">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-indigo-900">Verified Only</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.verifiedOnly}
                            onChange={(e) =>
                                onFilterChange({ ...filters, verifiedOnly: e.target.checked })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                </label>
            </div>

            {/* Clear Button */}
            <div className="pt-2">
                <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    className="w-full border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600"
                >
                    Reset all filters
                </Button>
            </div>
        </aside>
    );
}