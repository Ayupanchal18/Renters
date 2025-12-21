import { memo, lazy, Suspense } from "react";
import { PropertyCard } from "./property-card";
import { Button } from "../ui/button";
import { Loader2, Home, SearchX, RefreshCw, Map } from "lucide-react";

// Lazy load the map component for better performance
const PropertyMapView = lazy(() => import("./property-map-view"));

// Map loading fallback
const MapLoadingFallback = () => (
    <div className="w-full h-[500px] md:h-[600px] bg-muted rounded-2xl flex items-center justify-center">
        <div className="text-center">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
            <p className="text-muted-foreground">Loading map view...</p>
        </div>
    </div>
);

// Memoized PropertyCard for performance
const MemoizedPropertyCard = memo(PropertyCard);

// Skeleton loading component
const PropertySkeleton = memo(({ viewMode }) => {
    if (viewMode === "list") {
        return (
            <div className="flex flex-col sm:flex-row bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full sm:w-80 h-56 sm:h-auto sm:min-h-[220px] flex-shrink-0 bg-muted" />
                <div className="flex-1 p-5 sm:p-6 space-y-4">
                    <div className="space-y-2">
                        <div className="h-6 bg-muted rounded-lg w-3/4" />
                        <div className="h-4 bg-muted rounded-lg w-1/2" />
                    </div>
                    <div className="flex gap-4">
                        <div className="h-8 w-8 bg-muted rounded-lg" />
                        <div className="h-8 w-8 bg-muted rounded-lg" />
                        <div className="h-8 w-8 bg-muted rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded-md w-16" />
                        <div className="h-6 bg-muted rounded-md w-16" />
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div className="h-8 bg-muted rounded-lg w-28" />
                        <div className="flex gap-2">
                            <div className="h-10 w-10 bg-muted rounded-xl" />
                            <div className="h-10 w-24 bg-muted rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
            <div className="h-52 bg-muted" />
            <div className="p-4 space-y-3">
                <div className="space-y-2">
                    <div className="h-5 bg-muted rounded-lg w-full" />
                    <div className="h-4 bg-muted rounded-lg w-2/3" />
                </div>
                <div className="flex items-center justify-between py-3 border-y border-border">
                    <div className="h-4 bg-muted rounded w-12" />
                    <div className="h-4 bg-muted rounded w-12" />
                    <div className="h-4 bg-muted rounded w-12" />
                </div>
                <div className="flex gap-2 pt-1">
                    <div className="h-9 bg-muted rounded-xl flex-1" />
                    <div className="h-9 bg-muted rounded-xl flex-1" />
                </div>
            </div>
        </div>
    );
});

PropertySkeleton.displayName = "PropertySkeleton";

// Empty state component
const EmptyState = memo(({ hasFilters, onClearFilters }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
            {/* Icon */}
            <div className="relative mx-auto mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    {hasFilters ? (
                        <SearchX className="w-10 h-10 text-primary/60" />
                    ) : (
                        <Home className="w-10 h-10 text-primary/60" />
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg">🏠</span>
                </div>
            </div>
            
            {/* Text */}
            <h3 className="text-xl font-semibold text-foreground mb-2">
                {hasFilters ? "No matching properties" : "No properties available"}
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
                {hasFilters 
                    ? "We couldn't find any properties matching your criteria. Try adjusting your filters or search terms."
                    : "There are currently no properties listed. Please check back later for new listings."
                }
            </p>
            
            {/* Action */}
            {hasFilters && (
                <Button 
                    onClick={onClearFilters}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-11 font-medium"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear all filters
                </Button>
            )}
        </div>
    </div>
));

EmptyState.displayName = "EmptyState";

export function ListingsGrid({ 
    viewMode, 
    properties = [], 
    loading, 
    onClearFilters,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
    total = 0,
    wishlistIds = new Set(),
    onWishlistChange
}) {
    const hasFilters = properties.length === 0 && !loading;

    if (viewMode === "map") {
        return (
            <Suspense fallback={<MapLoadingFallback />}>
                <PropertyMapView properties={properties} loading={loading} />
            </Suspense>
        );
    }

    return (
        <div className="space-y-6" role="main" aria-label="Property listings">
            {/* Loading State */}
            {loading && (
                <div role="status" aria-label="Loading properties">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <PropertySkeleton key={index} viewMode="grid" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <PropertySkeleton key={index} viewMode="list" />
                            ))}
                        </div>
                    )}
                    <span className="sr-only">Loading properties...</span>
                </div>
            )}

            {/* Properties Grid/List */}
            {!loading && properties.length > 0 && (
                <>
                    {viewMode === "grid" ? (
                        <div 
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                            role="grid"
                            aria-label="Property grid view"
                        >
                            {properties.map((property) => (
                                <div key={property._id} role="gridcell">
                                    <MemoizedPropertyCard 
                                        property={property} 
                                        viewMode="grid"
                                        initialSaved={wishlistIds.has(property._id)}
                                        onWishlistChange={onWishlistChange}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div 
                            className="space-y-4"
                            role="list"
                            aria-label="Property list view"
                        >
                            {properties.map((property) => (
                                <div key={property._id} role="listitem">
                                    <MemoizedPropertyCard 
                                        property={property} 
                                        viewMode="list"
                                        initialSaved={wishlistIds.has(property._id)}
                                        onWishlistChange={onWishlistChange}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results Summary */}
                    {total > 0 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-medium text-foreground">{properties.length}</span> of{' '}
                                <span className="font-medium text-foreground">{total}</span> properties
                            </p>
                        </div>
                    )}

                    {/* Load More Button */}
                    {hasMore && onLoadMore && (
                        <div className="flex justify-center pt-6">
                            <Button
                                onClick={onLoadMore}
                                disabled={isLoadingMore}
                                variant="outline"
                                className="px-8 h-12 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-medium transition-all"
                                aria-label="Load more properties"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Loading more...
                                    </>
                                ) : (
                                    <>
                                        Load more properties
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Empty State */}
            {!loading && properties.length === 0 && (
                <EmptyState 
                    hasFilters={hasFilters} 
                    onClearFilters={onClearFilters}
                />
            )}
        </div>
    );
}
