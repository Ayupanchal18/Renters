import { useState, useEffect } from "react";
import { Heart, MapPin, Bed, Bath, Home, Phone, MessageCircle, Sparkles, BadgeCheck, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { PropertyImage } from "../ui/lazy-image";
import { useNavigationStateContext } from "../ui/navigation-state-provider";
import wishlistService from "../../api/wishlistService";
import { isAuthenticated } from "../../utils/auth";

export function PropertyCard({ property, viewMode, initialSaved = false, onWishlistChange }) {
    const navigate = useNavigate();
    const { navigateWithState } = useNavigationStateContext();

    const [isSaved, setIsSaved] = useState(initialSaved);
    const [isLoading, setIsLoading] = useState(false);

    // Sync with initialSaved prop when it changes
    useEffect(() => {
        setIsSaved(initialSaved);
    }, [initialSaved]);

    const handleClick = (slug) => {
        // Navigate to correct route based on listing type
        const route = property.listingType === 'buy' 
            ? `/buy/${slug}` 
            : `/rent/${slug}`;
        
        navigateWithState(route, {
            saveViewState: {
                fromListings: true,
                propertyId: property._id,
                timestamp: Date.now()
            }
        });
    };

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();

        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        try {
            const result = await wishlistService.toggleWishlist(property._id, isSaved);
            setIsSaved(result.isFavorited);
            onWishlistChange?.(property._id, result.isFavorited);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (!price) return '₹0';

        // For large prices (buy properties), use compact format
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} L`;
        }

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    // Get the appropriate price based on listing type
    const getPrice = () => {
        if (property.listingType === 'buy') {
            return property.sellingPrice;
        }
        return property.monthlyRent;
    };

    // Get price suffix based on listing type
    const getPriceSuffix = () => {
        return property.listingType === 'buy' ? '' : '/mo';
    };

    // Get owner phone number
    const getOwnerPhone = () => {
        return property.ownerPhone || property.contactPhone || property.phone || property.owner?.phone || '+91 9876543210';
    };

    // Handle call button click - opens dial pad
    const handleCall = (e) => {
        e.stopPropagation();
        const phone = getOwnerPhone().replace(/\s+/g, '');
        window.location.href = `tel:${phone}`;
    };

    // Handle message button click - navigate to messages
    const handleMessage = (e) => {
        e.stopPropagation();
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        // Navigate to messages with property context
        navigate('/messages', {
            state: {
                propertyId: property._id,
                ownerId: property.owner?._id || property.ownerId,
                propertyTitle: property.title
            }
        });
    };

    // Capitalize first letter
    const capitalizeFirst = (str) => {
        if (!str) return 'Room';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    /* ------------------------- LIST VIEW ------------------------- */
    if (viewMode === "list") {
        return (
            <article
                className="group relative bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer"
                onClick={() => handleClick(property.slug)}
            >
                <div className="flex flex-col sm:flex-row">
                    {/* Image Section */}
                    <div className="relative w-full sm:w-44 md:w-52 lg:w-60 h-44 sm:h-auto sm:min-h-[180px] flex-shrink-0 overflow-hidden bg-muted">
                        <PropertyImage
                            property={property}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={false}
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                            {property.verified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
                                    <BadgeCheck className="w-3 h-3" />
                                    Verified
                                </span>
                            )}
                            {property.featured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Featured
                                </span>
                            )}
                        </div>
                        
                        {/* Mobile: Price overlay on image */}
                        <div className="sm:hidden absolute bottom-2.5 right-2.5 bg-white/95 dark:bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                            <span className="text-lg font-bold text-primary">{formatPrice(getPrice())}</span>
                            <span className="text-[10px] text-muted-foreground ml-0.5">{getPriceSuffix()}</span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                        {/* Top: Title, Location, Price */}
                        <div>
                            {/* Title & Price Row */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {property.title}
                                </h3>
                                {/* Desktop: Price */}
                                <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                                    <span className="text-xl font-bold text-primary">{formatPrice(getPrice())}</span>
                                    <span className="text-xs text-muted-foreground">{getPriceSuffix()}</span>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                                <MapPin className="w-4 h-4 text-primary/60 flex-shrink-0" />
                                <span className="line-clamp-1">{property.address || `${property.city}, ${property.state}`}</span>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1.5">
                                    <Bed className="w-4 h-4 text-primary/60" />
                                    <span className="font-medium text-foreground">{property.bedrooms}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Bath className="w-4 h-4 text-primary/60" />
                                    <span className="font-medium text-foreground">{property.bathrooms}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Home className="w-4 h-4 text-primary/60" />
                                    <span className="font-medium text-foreground">{capitalizeFirst(property.propertyType)}</span>
                                </span>
                            </div>

                            {/* Amenities */}
                            {property.amenities?.length > 0 && (
                                <div className="flex items-center flex-wrap gap-1.5 mb-3">
                                    {property.amenities.slice(0, 4).map((amenity) => (
                                        <span key={amenity} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-lg">
                                            {amenity}
                                        </span>
                                    ))}
                                    {property.amenities.length > 4 && (
                                        <span className="text-xs text-primary font-medium">+{property.amenities.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom: Actions Row */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                            <button
                                onClick={handleToggleFavorite}
                                disabled={isLoading}
                                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all border ${isSaved
                                    ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                                    : "text-muted-foreground hover:text-foreground border-border hover:border-primary/30 hover:bg-muted"
                                    }`}
                                aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                            </button>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 text-xs rounded-xl border-border hover:bg-muted hover:border-primary/30 hidden sm:flex"
                                    onClick={handleCall}
                                >
                                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                                    Call
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-9 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-1.5"
                                    onClick={handleMessage}
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Message
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    /* ------------------------- GRID VIEW ------------------------- */
    return (
        <article
            className="group h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 cursor-pointer"
            onClick={() => handleClick(property.slug)}
        >
            {/* Image Section */}
            <div className="relative h-52 overflow-hidden">
                <PropertyImage
                    property={property}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    priority={false}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {property.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                        </span>
                    )}
                    {property.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Featured
                        </span>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleToggleFavorite}
                    disabled={isLoading}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/20 transition-all ${isLoading ? 'opacity-50' : 'hover:scale-110 hover:bg-white dark:hover:bg-card'
                        } ${isSaved ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' : ''}`}
                    aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
                >
                    <Heart className={`w-4 h-4 transition-colors ${isSaved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                </button>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg">
                        <span className="text-xl font-bold text-primary">{formatPrice(getPrice())}</span>
                        <span className="text-xs text-muted-foreground">{getPriceSuffix()}</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col p-4">
                {/* Title & Location */}
                <div className="mb-3">
                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {property.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                        <span className="line-clamp-1">{property.address}</span>
                    </div>
                </div>

                {/* Property Stats */}
                <div className="flex items-center justify-between py-3 border-y border-border mb-3">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Bed className="w-4 h-4 text-primary/70" />
                        <span className="font-medium text-foreground">{property.bedrooms}</span>
                        <span className="text-muted-foreground">Beds</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1.5 text-xs">
                        <Bath className="w-4 h-4 text-primary/70" />
                        <span className="font-medium text-foreground">{property.bathrooms}</span>
                        <span className="text-muted-foreground">Baths</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1.5 text-xs">
                        <Home className="w-4 h-4 text-primary/70" />
                        <span className="font-medium text-foreground truncate max-w-[60px]">{capitalizeFirst(property.roomType || property.propertyType)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs rounded-xl border-border hover:bg-muted hover:border-primary/30"
                        onClick={handleCall}
                    >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Call
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                        onClick={handleMessage}
                    >
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Message
                    </Button>
                </div>
            </div>
        </article>
    );
}
