import { Button } from "../ui/button";
import { LayoutGrid, List, Map, ChevronDown, SlidersHorizontal } from "lucide-react";

export function ViewControls({
    viewMode,
    onViewChange,
    sortBy,
    onSortChange,
    properties,
    listingType = "rent" // "rent" or "buy"
}) {
    // Use different sort values based on listing type
    const sortOptions = listingType === "buy" ? [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "price_low_to_high", label: "Price: Low to High" },
        { value: "price_high_to_low", label: "Price: High to Low" },
        { value: "featured", label: "Featured" },
    ] : [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "rent_low_to_high", label: "Rent: Low to High" },
        { value: "rent_high_to_low", label: "Rent: High to Low" },
        { value: "featured", label: "Featured" },
    ];

    const currentSort = sortOptions.find(opt => opt.value === sortBy)?.label || "Sort by";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-border">
            {/* Results Count */}
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-3xl bg-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{properties?.length || 0}</span>
                    {' '}properties found
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Sort Dropdown */}
                <div className="relative">
                    <div className="flex items-center">
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground mr-2 hidden sm:block" />
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px]"
                                aria-label="Sort properties"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* View Mode Toggle with sliding indicator */}
                <div className="relative flex items-center bg-muted rounded-xl p-1 gap-0.5">
                    {/* Sliding background indicator */}
                    <div
                        className="absolute h-9 bg-card shadow-sm rounded-lg transition-all duration-300 ease-out"
                        style={{
                            width: 'calc(33.333% - 2px)',
                            left: viewMode === "grid"
                                ? '4px'
                                : viewMode === "list"
                                    ? 'calc(33.333% + 2px)'
                                    : 'calc(66.666%)',
                        }}
                    />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("grid")}
                        className={`relative z-10 h-9 px-3 rounded-lg transition-colors duration-200 ${viewMode === "grid"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        aria-label="Grid view"
                        aria-pressed={viewMode === "grid"}
                    >
                        <LayoutGrid className={`w-4 h-4 transition-transform duration-200 ${viewMode === "grid" ? "scale-110" : ""}`} />
                        <span className="ml-2 text-xs font-medium hidden sm:inline">Grid</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("list")}
                        className={`relative z-10 h-9 px-3 rounded-lg transition-colors duration-200 ${viewMode === "list"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        aria-label="List view"
                        aria-pressed={viewMode === "list"}
                    >
                        <List className={`w-4 h-4 transition-transform duration-200 ${viewMode === "list" ? "scale-110" : ""}`} />
                        <span className="ml-2 text-xs font-medium hidden sm:inline">List</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("map")}
                        className={`relative z-10 h-9 px-3 rounded-lg transition-colors duration-200 ${viewMode === "map"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        aria-label="Map view"
                        aria-pressed={viewMode === "map"}
                    >
                        <Map className={`w-4 h-4 transition-transform duration-200 ${viewMode === "map" ? "scale-110" : ""}`} />
                        <span className="ml-2 text-xs font-medium hidden sm:inline">Map</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
