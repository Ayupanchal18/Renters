import { Button } from "../ui/button";
import { LayoutGrid, List, Map, ChevronDown, SlidersHorizontal } from "lucide-react";

export function ViewControls({
    viewMode,
    onViewChange,
    sortBy,
    onSortChange,
    properties
}) {
    const sortOptions = [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "rent_low_to_high", label: "Price: Low to High" },
        { value: "rent_high_to_low", label: "Price: High to Low" },
        { value: "featured", label: "Featured" },
    ];

    const currentSort = sortOptions.find(opt => opt.value === sortBy)?.label || "Sort by";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-border">
            {/* Results Count */}
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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

                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("grid")}
                        className={`h-9 px-3 rounded-lg transition-all ${
                            viewMode === "grid" 
                                ? "bg-card shadow-sm text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                        aria-label="Grid view"
                        aria-pressed={viewMode === "grid"}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="ml-2 text-xs font-medium hidden sm:inline">Grid</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("list")}
                        className={`h-9 px-3 rounded-lg transition-all ${
                            viewMode === "list" 
                                ? "bg-card shadow-sm text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                        aria-label="List view"
                        aria-pressed={viewMode === "list"}
                    >
                        <List className="w-4 h-4" />
                        <span className="ml-2 text-xs font-medium hidden sm:inline">List</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange("map")}
                        className={`h-9 px-3 rounded-lg transition-all ${
                            viewMode === "map" 
                                ? "bg-card shadow-sm text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                        aria-label="Map view"
                        aria-pressed={viewMode === "map"}
                    >
                        <Map className="w-4 h-4" />
                        <span className="ml-2 text-xs font-medium hidden sm:inline">Map</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
