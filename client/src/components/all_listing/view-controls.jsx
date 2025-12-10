import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import { Grid3X3, List, Map } from "lucide-react";

export function ViewControls({
    viewMode,
    onViewChange,
    sortBy,
    onSortChange,
    resultsCount = 247,
    properties
}) {


    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3 pb-2 border-b border-border">

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{properties?.length}</span> properties
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                    >
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="featured">Featured</option>
                    </select>
                </div>

                {/* View Mode Buttons */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange("grid")}
                        title="Grid view"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </Button>

                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange("list")}
                        title="List view"
                    >
                        <List className="w-4 h-4" />
                    </Button>

                    <Button
                        variant={viewMode === "map" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange("map")}
                        title="Map view"
                    >
                        <Map className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
