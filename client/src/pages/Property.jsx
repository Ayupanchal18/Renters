import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Share2, Heart, Calendar, Home, Sparkles } from 'lucide-react';

import { Button } from "../components/ui/button";
import { BackToTop } from "../components/ui/back-to-top";
import ImageGallery from "../components/property/image-gallery";
import PropertyOverview from "../components/property/property-overview";
import PropertySpecs from "../components/property/property-specs";
import PricingCard from "../components/property/pricing-card";
import OwnerCard from "../components/property/owner-card";
import PropertyAmenities from "../components/property/property-amenities";
import PropertyLocation from "../components/property/property-location";
import NearbyPlaces from "../components/property/nearby-places";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPropertyByID } from "../redux/slices/propertySlice";
import wishlistService from "../api/wishlistService";
import { isAuthenticated } from "../utils/auth";

// Loading skeleton
function PropertySkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="animate-pulse space-y-6">
                    {/* Back button skeleton */}
                    <div className="h-10 w-24 bg-muted rounded-lg" />
                    
                    {/* Gallery skeleton */}
                    <div className="aspect-[16/9] lg:aspect-[21/9] bg-muted rounded-2xl" />
                    
                    {/* Content grid skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-32 bg-muted rounded-xl" />
                            <div className="h-48 bg-muted rounded-xl" />
                            <div className="h-64 bg-muted rounded-xl" />
                        </div>
                        <div className="space-y-6">
                            <div className="h-64 bg-muted rounded-xl" />
                            <div className="h-48 bg-muted rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Error state
function PropertyError({ error, onRetry, onGoBack }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Home className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                    {error?.message || 'Property Not Found'}
                </h2>
                <p className="text-muted-foreground mb-8">
                    We couldn't load this property. It may have been removed or the link might be incorrect.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={onRetry} className="bg-primary hover:bg-primary/90">
                        Try Again
                    </Button>
                    <Button onClick={onGoBack} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PropertyPage() {
    const [propertyData, setPropertyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    
    const navigate = useNavigate();
    const { slug } = useParams();
    const dispatch = useDispatch();
    const { propertyDataId } = useSelector(state => state.postproperty);

    // Check wishlist status
    const checkWishlistStatus = useCallback(async (propertyId) => {
        if (!isAuthenticated() || !propertyId) return;
        try {
            const inWishlist = await wishlistService.isInWishlist(propertyId);
            setIsFavorited(inWishlist);
        } catch (err) {
            console.error('Wishlist check failed:', err);
        }
    }, []);

    // Toggle favorite
    const handleToggleFavorite = async () => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        if (favoriteLoading || !propertyData?._id) return;

        setFavoriteLoading(true);
        try {
            const result = await wishlistService.toggleWishlist(propertyData._id, isFavorited);
            setIsFavorited(result.isFavorited);
        } catch (err) {
            console.error('Toggle favorite failed:', err);
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Share property
    const handleShare = async () => {
        const shareData = {
            title: propertyData?.title || 'Property',
            text: `Check out this property: ${propertyData?.title}`,
            url: window.location.href,
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(window.location.href);
                }
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Fetch property
    const fetchProperty = useCallback(async () => {
        if (!slug) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const result = await dispatch(getPropertyByID({ key: slug })).unwrap();
            if (result?.data) {
                setPropertyData(result.data);
                checkWishlistStatus(result.data._id);
            } else {
                setError(new Error('Property not found'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [slug, dispatch, checkWishlistStatus]);

    useEffect(() => {
        fetchProperty();
    }, [fetchProperty]);

    useEffect(() => {
        if (propertyDataId?._id) {
            setPropertyData(propertyDataId);
            setLoading(false);
        }
    }, [propertyDataId]);

    // Format date helper
    const formatDate = (timestamp) => {
        if (!timestamp) return null;
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <PropertySkeleton />
            </>
        );
    }

    if (error || !propertyData) {
        return (
            <>
                <Navbar />
                <PropertyError 
                    error={error || { message: 'Property not found' }} 
                    onRetry={fetchProperty} 
                    onGoBack={() => navigate(-1)} 
                />
            </>
        );
    }

    const isRoomType = ['room', 'pg', 'hostel'].includes(propertyData.category);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    
                    {/* Top Navigation Bar */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to listings</span>
                            <span className="sm:hidden">Back</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="p-2.5 rounded-full bg-card border border-border hover:bg-muted transition-all"
                                title="Share"
                            >
                                <Share2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                disabled={favoriteLoading}
                                className={`p-2.5 rounded-full border transition-all ${
                                    isFavorited 
                                        ? 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800' 
                                        : 'bg-card border-border hover:bg-muted'
                                }`}
                                title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                            >
                                <Heart className={`w-4 h-4 transition-all ${
                                    isFavorited 
                                        ? 'fill-red-500 text-red-500' 
                                        : 'text-muted-foreground hover:text-red-500'
                                }`} />
                            </button>
                        </div>
                    </div>

                    {/* Image Gallery - Full Width */}
                    <ImageGallery
                        images={propertyData.photos || []}
                        title={propertyData.title || 'Property'}
                    />

                    {/* Main Content Grid */}
                    <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        
                        {/* Left Column - Property Details */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Property Overview */}
                            <PropertyOverview 
                                property={propertyData}
                                formatDate={formatDate}
                            />

                            {/* Property Specifications */}
                            <PropertySpecs 
                                property={propertyData}
                                isRoomType={isRoomType}
                            />

                            {/* Amenities */}
                            <PropertyAmenities property={propertyData} />

                            {/* Location */}
                            <PropertyLocation property={propertyData} />
                        </div>

                        {/* Right Column - Sticky Sidebar */}
                        <div className="space-y-6">
                            <div className="lg:sticky lg:top-6 space-y-6">
                                
                                {/* Pricing Card */}
                                <PricingCard property={propertyData} />

                                {/* Owner Card */}
                                <OwnerCard 
                                    owner={{
                                        id: propertyData.ownerId || propertyData.owner?._id || propertyData.owner,
                                        name: propertyData.ownerName,
                                        phone: propertyData.ownerPhone,
                                        email: propertyData.ownerEmail,
                                        ownerType: propertyData.ownerType,
                                        verificationStatus: propertyData.verificationStatus
                                    }}
                                    propertyId={propertyData._id}
                                />

                                {/* Nearby Places */}
                                <NearbyPlaces 
                                    property={propertyData}
                                    location={propertyData.locality || propertyData.city}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Listing Info Footer */}
                    {propertyData.listingNumber && (
                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <div className="flex items-center gap-1">
                                        <span className="whitespace-nowrap">Listing ID:</span>
                                        <span className="font-mono text-foreground text-xs break-all">{propertyData.listingNumber}</span>
                                    </div>
                                    {propertyData.createdAt && (
                                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                            Posted {formatDate(propertyData.createdAt)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-primary">
                                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="text-xs font-medium whitespace-nowrap">Premium Listing</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
            <BackToTop />
        </>
    );
}
