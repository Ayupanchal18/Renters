import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, Map, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { ScoreGauge } from "./ScoreGauge";
import { AmenitiesList } from "./AmenitiesList";
import { NeighborhoodMap } from "./NeighborhoodMap";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export default function NeighborhoodSection({ propertyId, property }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(true);
    const [activeCategory, setActiveCategory] = useState("");
    const [selectedAmenity, setSelectedAmenity] = useState(null);

    // Fetch neighborhood details
    const fetchNeighborhoodData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/properties/${propertyId}/neighborhood`);
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                setError(json.error || "Failed to load neighborhood analytics");
            }
        } catch (err) {
            console.error("Error loading neighborhood data:", err);
            setError("Network connection error.");
        } finally {
            setLoading(false);
        }
    }, [propertyId]);

    // Initial load and responsive collapse check
    useEffect(() => {
        if (propertyId) {
            fetchNeighborhoodData();
        }

        // Collapse by default on mobile screens (< 1024px)
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    }, [propertyId, fetchNeighborhoodData]);

    // Track amenity selection to sync list and map
    const handleAmenityClick = (amenity) => {
        const key = `${amenity.name}_${amenity.lat}_${amenity.lng}`;
        const selectedKey = selectedAmenity ? `${selectedAmenity.name}_${selectedAmenity.lat}_${selectedAmenity.lng}` : "";

        if (key === selectedKey) {
            setSelectedAmenity(null); // Toggle off
        } else {
            setSelectedAmenity(amenity);
        }
    };

    // Reset selected marker when switching category tabs
    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setSelectedAmenity(null);
    };

    // MongoDB coordinates: [lng, lat]. Leaflet expects: [lat, lng]
    const mongoCoords = property?.location?.coordinates;
    const propertyCoords = mongoCoords && mongoCoords.length >= 2
        ? [mongoCoords[1], mongoCoords[0]]
        : null;

    if (loading) {
        return (
            <div className="w-full bg-card border border-border rounded-2xl p-5 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <div className="space-y-1">
                        <div className="h-5 bg-muted rounded-md w-36 skeleton-wave" />
                        <div className="h-3 bg-muted rounded-md w-48 skeleton-wave" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                        <div className="flex gap-4">
                            <div className="w-32 h-32 bg-muted rounded-2xl skeleton-wave" />
                            <div className="w-32 h-32 bg-muted rounded-2xl skeleton-wave" />
                        </div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-7 bg-muted rounded-full w-16 skeleton-wave" />
                            ))}
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-muted rounded-xl w-full skeleton-wave" />
                            ))}
                        </div>
                    </div>
                    <div className="h-[280px] bg-muted rounded-2xl skeleton-wave" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-error mx-auto animate-pulse" />
                <div>
                    <h4 className="text-sm font-semibold text-foreground">Neighborhood Insights Unavailable</h4>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mx-auto flex items-center gap-1.5"
                    onClick={fetchNeighborhoodData}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Load
                </Button>
            </div>
        );
    }

    // Graceful fallback if coordinates are missing or Overpass resolves empty data
    if (!propertyCoords || !data || !data.available) {
        return (
            <div className="w-full bg-card border border-border/60 rounded-2xl p-6 text-center space-y-3.5">
                <Map className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                <div>
                    <h4 className="text-xs font-bold text-foreground">Neighborhood Insights</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        Neighborhood insights aren't available for this location yet. Geolocation values may be missing.
                    </p>
                </div>
            </div>
        );
    }

    const activeList = data.categories[activeCategory] || [];
    const selectedAmenityId = selectedAmenity
        ? `${selectedAmenity.name}_${selectedAmenity.lat}_${selectedAmenity.lng}`
        : null;

    return (
        <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Header Accordion Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/10 transition-colors border-b border-border/40"
                aria-expanded={isOpen}
                aria-controls="neighborhood-content-panel"
            >
                <div className="space-y-0.5">
                    <h2 className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        Explore Neighborhood
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-medium">
                        Walk score, public transit routes, schools, and nearby amenities
                    </p>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* Content panel */}
            {isOpen && (
                <div
                    id="neighborhood-content-panel"
                    className="p-5 space-y-6 animate-page-enter"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Score Gauges & Tabbed list */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Gauges row */}
                            <div className="flex flex-wrap gap-4 items-center">
                                <ScoreGauge
                                    score={data.walkScore}
                                    label="Walk Score"
                                    type="walk"
                                />
                                <ScoreGauge
                                    score={data.transitScore}
                                    label="Transit Score"
                                    type="transit"
                                />
                            </div>

                            {/* Amenity lists */}
                            <AmenitiesList
                                categories={data.categories}
                                activeCategory={activeCategory}
                                setActiveCategory={handleCategoryChange}
                                selectedAmenityId={selectedAmenityId}
                                onAmenityClick={handleAmenityClick}
                            />
                        </div>

                        {/* Mini-Map */}
                        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
                            <NeighborhoodMap
                                propertyCoords={propertyCoords}
                                amenities={activeList}
                                selectedAmenity={selectedAmenity}
                            />
                            
                            {/* Attributions and paid provider indicators */}
                            <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1 border-t border-border/20 pt-2.5">
                                <span>Data from OpenStreetMap</span>
                                <span className="opacity-75">Swappable with Google Places/WalkScore APIs</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
