import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Tag } from "lucide-react";
import { PropertyCard } from "../all_listing/property-card";
import propertyService from "../../api/propertyService";
import { Badge } from "../ui/badge";

export default function SimilarProperties({ currentProperty, listingType = "rent" }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const scrollContainerRef = useRef(null);

    const propertyId = currentProperty?._id || currentProperty?.id;
    const slug = currentProperty?.slug || propertyId;
    const city = currentProperty?.city || "";
    const locality = currentProperty?.locality || "";

    useEffect(() => {
        const fetchSimilar = async () => {
            if (!slug && !propertyId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Call dedicated recommendations API
                const res = await propertyService.getSimilarProperties(slug || propertyId, { limit: 12 });
                const items = res.data?.data?.items || res.data?.items || [];
                setProperties(items);
            } catch (err) {
                console.warn("Dedicated similarity API failed, attempting fallback query:", err);
                // Fallback attempt: query properties by city
                try {
                    const fallbackFn = listingType === "buy" 
                        ? propertyService.getBuyProperties 
                        : propertyService.getRentProperties;
                    
                    const response = await fallbackFn({ limit: 6, city: city });
                    const items = response.data?.items || response.data?.properties || [];
                    const filtered = items.filter(p => (p._id || p.id) !== propertyId).slice(0, 6);
                    
                    setProperties(filtered.map(p => ({
                        ...p,
                        matchReason: p.locality === locality ? "Same Locality" : `In ${p.city || "Area"}`
                    })));
                } catch (fallbackErr) {
                    console.error("Fallback query failed:", fallbackErr);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSimilar();
    }, [slug, propertyId, city, locality, listingType]);

    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === "left" ? -340 : 340;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    // Helper to extract base city string
    const getCityBase = (str) => str ? str.split(",")[0].toLowerCase().trim() : "";

    // Filter properties based on tab choice
    const filteredProperties = properties.filter(p => {
        if (activeFilter === "nearby") {
            if (p.isSameCity) return true;
            const targetCityBase = getCityBase(city);
            const candCityBase = getCityBase(p.city);
            const sameLocality = p.locality && locality && (
                p.locality.toLowerCase().trim().includes(locality.toLowerCase().trim()) ||
                locality.toLowerCase().trim().includes(p.locality.toLowerCase().trim())
            );
            const sameCity = candCityBase && targetCityBase && (
                candCityBase.includes(targetCityBase) ||
                targetCityBase.includes(candCityBase) ||
                (p.address && p.address.toLowerCase().includes(targetCityBase))
            );
            return sameLocality || sameCity;
        }
        if (activeFilter === "budget") {
            return p.matchReasons?.includes("Similar Price") || p.matchReasons?.includes("Similar Budget") || p.matchReason === "Similar Price" || p.matchReason === "Similar Budget";
        }
        return true;
    });

    // Don't render anything if loading is complete and no items exist
    if (!loading && properties.length === 0) {
        return null;
    }

    const viewAllLink = listingType === "buy" ? "/buy-properties" : "/rent-properties";

    return (
        <section className="bg-card rounded-2xl border border-border/80 p-5 sm:p-6 my-6 shadow-xs overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="w-4 h-4" />
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                            Similar Properties
                        </h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recommended listings in {city || "your area"} matching budget and nearby location
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View All Button */}
                    <Link
                        to={`${viewAllLink}${city ? `?city=${encodeURIComponent(city)}` : ""}`}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors mr-2"
                    >
                        View All →
                    </Link>

                    {/* Desktop Scroll Controls */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        <button
                            onClick={() => handleScroll("left")}
                            className="p-2 rounded-full border border-border hover:bg-muted text-foreground transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleScroll("right")}
                            className="p-2 rounded-full border border-border hover:bg-muted text-foreground transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            {properties.length > 2 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => setActiveFilter("all")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                            activeFilter === "all"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted/60 hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        All Recommendations ({properties.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter("nearby")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                            activeFilter === "nearby"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted/60 hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        <MapPin className="w-3 h-3" />
                        Nearby {locality ? `(${locality})` : city ? `(${city})` : ""}
                    </button>
                    <button
                        onClick={() => setActiveFilter("budget")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                            activeFilter === "budget"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted/60 hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        <Tag className="w-3 h-3" />
                        Similar Budget
                    </button>
                </div>
            )}

            {/* Content Carousel / Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-muted/60 animate-pulse" />
                    ))}
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                    No properties matching this filter. Try selecting "All Recommendations".
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 pt-1"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {filteredProperties.map(property => (
                        <div
                            key={property._id || property.id}
                            className="flex-shrink-0 w-[290px] sm:w-[320px] snap-start relative group"
                        >
                            {/* Similarity Tag */}
                            {property.matchReason && (
                                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                                    <Badge className="bg-black/70 backdrop-blur-md text-white border-0 text-[10px] font-semibold px-2 py-0.5 shadow-xs">
                                        {property.matchReason}
                                    </Badge>
                                </div>
                            )}

                            <PropertyCard
                                property={property}
                                viewMode="grid"
                                compact
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Explore Nearby Quick Links (NoBroker pattern) */}
            {city && (
                <div className="mt-5 pt-4 border-t border-border/60">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                        Explore Nearby Options in {city}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <Link
                            to={`${viewAllLink}?city=${encodeURIComponent(city)}`}
                            className="px-2.5 py-1 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors border border-border/40 text-[11px]"
                        >
                            All Properties in {city}
                        </Link>
                        {locality && (
                            <Link
                                to={`${viewAllLink}?q=${encodeURIComponent(locality)}`}
                                className="px-2.5 py-1 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors border border-border/40 text-[11px]"
                            >
                                Properties in {locality}
                            </Link>
                        )}
                        {currentProperty?.category && (
                            <Link
                                to={`${viewAllLink}?category=${encodeURIComponent(currentProperty.category)}&city=${encodeURIComponent(city)}`}
                                className="px-2.5 py-1 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors border border-border/40 text-[11px] capitalize"
                            >
                                {currentProperty.category}s in {city}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
