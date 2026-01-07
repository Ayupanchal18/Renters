import { Button } from "../ui/button";
import { LayoutGrid, List, Map, ChevronDown, SlidersHorizontal } from "lucide-react";

export function ViewControls({
    viewMode,
    onViewChange,
    sortBy,
    onSortChange,
    properties,
    total = 0,
    listingType = "rent", // "rent" or "buy"
    activeFilterCount = 0,
    onFilterClick,
    onClearFilters
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

    // Use total if provided, otherwise fall back to properties length
    const displayCount = total > 0 ? total : (properties?.length || 0);

    return (
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-5 border-b border-border">
            {/* Left side: Filter button (mobile) + Results Count */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Filter Button - integrated into this row */}
                {onFilterClick && (
                    <button
                        onClick={onFilterClick}
                        className="lg:hidden relative flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors flex-shrink-0"
                        aria-label="Open filters"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                )}
                
                {/* Results Count */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        <span className="font-semibold text-foreground">{displayCount}</span> found
                    </p>
                </div>
            </div>

            {/* Right side: Sort + View toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Sort Dropdown - Compact on mobile */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="appearance-none pl-2 sm:pl-3 pr-6 sm:pr-8 py-1.5 sm:py-2 bg-card border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        aria-label="Sort properties"
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* View Mode Toggle - Compact */}
                <div className="relative flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                    {/* Desktop sliding indicator (3 buttons) */}
                    <div
                        className="absolute h-7 sm:h-8 bg-card shadow-sm rounded-md transition-all duration-300 ease-out hidden sm:block"
                        style={{
                            width: 'calc(33.333% - 2px)',
                            left: viewMode === "grid"
                                ? '2px'
                                : viewMode === "list"
                                    ? 'calc(33.333% + 1px)'
                                    : 'calc(66.666%)',
                        }}
                    />
                    {/* Mobile sliding indicator (2 buttons) */}
                    <div
                        className="absolute h-7 bg-card shadow-sm rounded-md transition-all duration-300 ease-out sm:hidden"
                        style={{
                            width: 'calc(50% - 2px)',
                            left: viewMode === "grid" || viewMode === "list"
                                ? '2px'
                                : 'calc(50%)',
                        }}
                    />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("grid")}
                        className={`relative z-10 h-7 sm:h-8 w-7 sm:w-auto sm:px-2.5 rounded-md transition-colors duration-200 ${viewMode === "grid"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        aria-label="Grid view"
                        aria-pressed={viewMode === "grid"}
                    >
                        <LayoutGrid className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${viewMode === "grid" ? "scale-110" : ""}`} />
                        <span className="ml-1.5 text-xs font-medium hidden sm:inline">Grid</span>
                    </Button>

                    {/* List button - hidden on mobile */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("list")}
                        className={`relative z-10 h-8 px-2.5 rounded-md transition-colors duration-200 hidden sm:flex ${viewMode === "list"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        aria-label="List view"
                        aria-pressed={viewMode === "list"}
                    >
                        <List className={`w-4 h-4 transition-transform duration-200 ${viewMode === "list" ? "scale-110" : ""}`} />
                        <span className="ml-1.5 text-xs font-medium hidden sm:inline">List</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("map")}
                        className={`relative z-10 h-7 sm:h-8 w-7 sm:w-auto sm:px-2.5 rounded-md transition-colors duration-200 ${viewMode === "map"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        aria-label="Map view"
                        aria-pressed={viewMode === "map"}
                    >
                        <Map className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${viewMode === "map" ? "scale-110" : ""}`} />
                        <span className="ml-1.5 text-xs font-medium hidden sm:inline">Map</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
