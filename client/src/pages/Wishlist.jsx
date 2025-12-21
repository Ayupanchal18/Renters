import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
    Heart, 
    MapPin, 
    Bed, 
    Bath, 
    Square, 
    Trash2, 
    ExternalLink,
    HeartOff,
    Search,
    SlidersHorizontal,
    Loader2,
    AlertCircle
} from "lucide-react";
import wishlistService from "../api/wishlistService";
import { isAuthenticated } from "../utils/auth";

export default function Wishlist() {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("recent");

    // Fetch wishlist from API
    const fetchWishlist = useCallback(async () => {
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const data = await wishlistService.getWishlist();
            // Extract property data from wishlist items
            const properties = data
                .filter(item => item.property)
                .map(item => ({
                    ...item.property,
                    wishlistId: item._id,
                    addedAt: item.createdAt
                }));
            setWishlist(properties);
        } catch (err) {
            console.error('Failed to fetch wishlist:', err);
            setError('Failed to load your wishlist. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const handleRemove = async (propertyId) => {
        if (removingId) return;
        
        setRemovingId(propertyId);
        try {
            await wishlistService.removeFromWishlist(propertyId);
            setWishlist(prev => prev.filter(p => p._id !== propertyId));
        } catch (err) {
            console.error('Failed to remove from wishlist:', err);
        } finally {
            setRemovingId(null);
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Price on request';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getPropertyImage = (property) => {
        if (property.photos?.length > 0) {
            return property.photos[0];
        }
        if (property.images?.length > 0) {
            return property.images[0];
        }
        return '/placeholder-property.jpg';
    };

    const filteredWishlist = wishlist.filter(p => 
        (p.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.address?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.locality?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const sortedWishlist = [...filteredWishlist].sort((a, b) => {
        if (sortBy === "price-low") return (a.monthlyRent || 0) - (b.monthlyRent || 0);
        if (sortBy === "price-high") return (b.monthlyRent || 0) - (a.monthlyRent || 0);
        // recent - sort by when added to wishlist
        return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
    });

    // Not authenticated state
    if (!isAuthenticated()) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-6xl mx-auto px-4 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="p-6 bg-muted/50 rounded-full mb-6">
                            <Heart className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Sign in to view your wishlist
                        </h2>
                        <p className="text-muted-foreground max-w-md mb-6">
                            Save your favorite properties and access them anytime by signing in to your account.
                        </p>
                        <Button 
                            onClick={() => navigate('/login')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Sign In
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                            <Heart className="h-6 w-6 text-rose-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            My Wishlist
                        </h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        {loading ? 'Loading...' : `${wishlist.length} ${wishlist.length === 1 ? 'property' : 'properties'} saved for later`}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading your wishlist...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="p-4 bg-destructive/10 rounded-full mb-4">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md mb-4">
                            {error}
                        </p>
                        <Button onClick={fetchWishlist} variant="outline">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && (
                    <>
                        {/* Search and Filter Bar */}
                        {wishlist.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search your wishlist..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2.5 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    >
                                        <option value="recent">Recently Added</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Wishlist Grid */}
                        {sortedWishlist.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sortedWishlist.map((property) => (
                                    <Card 
                                        key={property._id} 
                                        className="group overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                    >
                                        {/* Image Section */}
                                        <div className="relative h-52 overflow-hidden">
                                            <img
                                                src={getPropertyImage(property)}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemove(property._id)}
                                                disabled={removingId === property._id}
                                                className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors group/btn disabled:opacity-50"
                                                title="Remove from wishlist"
                                            >
                                                {removingId === property._id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover/btn:text-red-500 transition-colors" />
                                                )}
                                            </button>

                                            {/* Wishlist Badge */}
                                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-rose-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                                                <Heart className="h-3 w-3 fill-current" />
                                                Saved
                                            </div>

                                            {/* Price Tag */}
                                            <div className="absolute bottom-3 left-3">
                                                <span className="px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 text-primary font-bold rounded-lg shadow-md">
                                                    {formatPrice(property.monthlyRent)}
                                                    {property.monthlyRent && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                                                </span>
                                            </div>
                                        </div>

                                        <CardContent className="p-4">
                                            {/* Title */}
                                            <h3 className="font-semibold text-lg text-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                                                {property.title || 'Untitled Property'}
                                            </h3>

                                            {/* Location */}
                                            <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm line-clamp-1">
                                                    {property.address || property.locality || 'Location not specified'}
                                                </span>
                                            </div>

                                            {/* Property Features */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                                                <div className="flex items-center gap-1.5">
                                                    <Bed className="h-4 w-4" />
                                                    <span>{property.bedrooms || 0} Beds</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Bath className="h-4 w-4" />
                                                    <span>{property.bathrooms || 0} Bath</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Square className="h-4 w-4" />
                                                    <span>{property.builtUpArea || 'N/A'} sqft</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <Link to={`/properties/${property.slug || property._id}`} className="flex-1">
                                                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleRemove(property._id)}
                                                    disabled={removingId === property._id}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
                                                >
                                                    {removingId === property._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <HeartOff className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <div className="p-6 bg-muted/50 rounded-full mb-6">
                                    <Heart className="h-16 w-16 text-muted-foreground" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2">
                                    {searchQuery ? "No matching properties" : "Your wishlist is empty"}
                                </h2>
                                <p className="text-muted-foreground text-center max-w-md mb-6">
                                    {searchQuery 
                                        ? "Try adjusting your search to find what you're looking for."
                                        : "Start exploring properties and save your favorites here for easy access later."
                                    }
                                </p>
                                <Link to="/listings">
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                        <Search className="h-4 w-4 mr-2" />
                                        Browse Properties
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Quick Stats */}
                        {wishlist.length > 0 && (
                            <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border">
                                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Heart className="h-4 w-4 text-rose-500" />
                                        <span>{wishlist.length} properties in your wishlist</span>
                                    </div>
                                    <Link to="/listings" className="text-primary hover:underline font-medium">
                                        Discover more properties →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
