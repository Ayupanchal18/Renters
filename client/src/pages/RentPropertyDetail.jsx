import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
    ArrowLeft, Share2, Heart, Calendar, Home, 
    MapPin, Phone, MessageCircle, IndianRupee, Bed, Bath, 
    Maximize, CheckCircle, Clock, Shield, ChevronDown,
    Building2, Layers, Car, Compass, Users, ChefHat, Key
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BackToTop } from "../components/ui/back-to-top";
import ImageGallery from "../components/property/image-gallery";
import PropertyAmenities from "../components/property/property-amenities";
import PropertyLocation from "../components/property/property-location";
import NearbyPlaces from "../components/property/nearby-places";
import OwnerCard from "../components/property/owner-card";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { generatePropertySchema, generateBreadcrumbs } from '../utils/structuredData';
import propertyService from "../api/propertyService";
import wishlistService from "../api/wishlistService";
import { isAuthenticated } from "../utils/auth";
import { useMessages } from "../hooks/useMessages";
import { PropertyCard } from "../components/all_listing/property-card";

/**
 * RentPropertyDetail Page Component
 * Displays detailed view of a rent property with rent-specific fields
 */

// Loading skeleton
function PropertySkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="animate-pulse">
                <div className="aspect-[4/3] sm:aspect-[16/9] bg-muted" />
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-20 bg-muted rounded-xl" />
                    <div className="grid grid-cols-3 gap-2">
                        {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Error state
function PropertyError({ error, onRetry, onGoBack }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Home className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                    {error?.message || 'Rental Property Not Found'}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                    We couldn't load this rental property. It may have been removed or is listed for sale.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={onRetry} size="sm">Try Again</Button>
                    <Button onClick={onGoBack} variant="outline" size="sm">Go Back</Button>
                </div>
            </div>
        </div>
    );
}

// Quick Spec Item Component
function QuickSpec({ icon: Icon, value, label, color = "primary" }) {
    if (!value) return null;
    const colorClasses = {
        primary: "bg-primary/10 text-primary",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
    return (
        <div className={`flex flex-col items-center p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-base font-bold">{value}</span>
            <span className="text-[10px] font-medium opacity-70">{label}</span>
        </div>
    );
}


// Rent Price Display Component - Shows rent-specific pricing (Requirement 6.3)
function RentPriceDisplay({ property }) {
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return null;
        return new Intl.NumberFormat('en-IN').format(amount);
    };

    return (
        <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium opacity-80">Monthly Rent</p>
                    <div className="flex items-baseline gap-0.5">
                        <IndianRupee className="w-5 h-5" />
                        <span className="text-2xl font-bold">
                            {formatCurrency(property.monthlyRent) || 'Contact'}
                        </span>
                        <span className="text-xs opacity-70">/mo</span>
                    </div>
                </div>
                {(property.rentNegotiable || property.negotiable) && (
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">
                        Negotiable
                    </Badge>
                )}
            </div>
            
            {/* Rent-specific additional costs */}
            {(property.securityDeposit || property.maintenanceCharge) && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/20 text-xs">
                    {property.securityDeposit > 0 && (
                        <div>
                            <span className="opacity-70">Security Deposit: </span>
                            <span className="font-semibold">₹{formatCurrency(property.securityDeposit)}</span>
                        </div>
                    )}
                    {property.maintenanceCharge > 0 && (
                        <div>
                            <span className="opacity-70">Maintenance: </span>
                            <span className="font-semibold">₹{formatCurrency(property.maintenanceCharge)}/mo</span>
                        </div>
                    )}
                </div>
            )}

            {/* Rent-specific details */}
            {(property.preferredTenants || property.leaseDuration) && (
                <div className="flex gap-4 mt-2 pt-2 border-t border-white/20 text-xs">
                    {property.preferredTenants && property.preferredTenants !== 'any' && (
                        <div>
                            <span className="opacity-70">Preferred: </span>
                            <span className="font-semibold capitalize">{property.preferredTenants}</span>
                        </div>
                    )}
                    {property.leaseDuration && (
                        <div>
                            <span className="opacity-70">Lease: </span>
                            <span className="font-semibold">{property.leaseDuration}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Sticky Contact Bar for Mobile - "Contact Owner" CTA (Requirement 6.6)
function MobileContactBar({ property, onMessage, onCall, isCreatingConversation }) {
    const formatCurrency = (amount) => {
        if (!amount) return null;
        return new Intl.NumberFormat('en-IN').format(amount);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border p-3 lg:hidden">
            <div className="flex items-center gap-3 max-w-lg mx-auto">
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-foreground">
                            ₹{formatCurrency(property.monthlyRent)}
                        </span>
                        <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    {(property.rentNegotiable || property.negotiable) && (
                        <span className="text-[10px] text-primary font-medium">Negotiable</span>
                    )}
                </div>
                <Button
                    onClick={onCall}
                    variant="outline"
                    size="sm"
                    className="h-10 px-4"
                >
                    <Phone className="w-4 h-4" />
                </Button>
                <Button
                    onClick={onMessage}
                    disabled={isCreatingConversation}
                    size="sm"
                    className="h-10 px-4 flex-1 max-w-[140px]"
                >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    {isCreatingConversation ? 'Starting...' : 'Contact Owner'}
                </Button>
            </div>
        </div>
    );
}

// Property Details Grid with rent-specific fields
function PropertyDetailsGrid({ property, isRoomType }) {
    const details = [];

    if (isRoomType) {
        if (property.roomType) details.push({ label: 'Room Type', value: property.roomType, icon: Users });
        if (property.bathroomType) details.push({ label: 'Bathroom', value: property.bathroomType, icon: Bath });
        details.push({ label: 'Kitchen', value: property.kitchenAvailable ? 'Available' : 'Not Available', icon: ChefHat });
    } else {
        if (property.bedrooms) details.push({ label: 'Bedrooms', value: property.bedrooms, icon: Bed });
        if (property.bathrooms) details.push({ label: 'Bathrooms', value: property.bathrooms, icon: Bath });
        if (property.balconies) details.push({ label: 'Balconies', value: property.balconies, icon: Building2 });
    }

    if (property.builtUpArea) details.push({ label: 'Built-up Area', value: `${property.builtUpArea} sq.ft`, icon: Maximize });
    if (property.carpetArea) details.push({ label: 'Carpet Area', value: `${property.carpetArea} sq.ft`, icon: Maximize });
    if (property.floorNumber !== null && property.floorNumber !== undefined) {
        const floorText = property.totalFloors ? `${property.floorNumber} of ${property.totalFloors}` : `${property.floorNumber}`;
        details.push({ label: 'Floor', value: floorText, icon: Layers });
    }
    if (property.facingDirection) details.push({ label: 'Facing', value: property.facingDirection, icon: Compass });
    if (property.parking) details.push({ label: 'Parking', value: property.parking, icon: Car });
    if (property.propertyAge) details.push({ label: 'Property Age', value: property.propertyAge, icon: Calendar });

    if (details.length === 0) return null;

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Property Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {details.map((detail, idx) => {
                    const Icon = detail.icon;
                    return (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
                            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{detail.label}</p>
                                <p className="text-sm font-medium text-foreground capitalize truncate">{detail.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({ title, children, defaultOpen = true, count }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    {count !== undefined && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                            {count}
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

// Related Rent Properties Section (Requirement 6.5)
function RelatedRentProperties({ currentPropertyId, city, category }) {
    const [relatedProperties, setRelatedProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedProperties = async () => {
            try {
                const params = {
                    limit: 4,
                    city: city,
                    category: category,
                };
                const response = await propertyService.getRentProperties(params);
                const properties = response.data?.items || response.data?.properties || [];
                // Filter out current property
                const filtered = properties.filter(p => p._id !== currentPropertyId).slice(0, 3);
                setRelatedProperties(filtered);
            } catch (error) {
                console.error('Error fetching related rent properties:', error);
            } finally {
                setLoading(false);
            }
        };

        if (city || category) {
            fetchRelatedProperties();
        } else {
            setLoading(false);
        }
    }, [currentPropertyId, city, category]);

    if (loading) {
        return (
            <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Similar Rentals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (relatedProperties.length === 0) return null;

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Similar Rentals</h3>
                <Link 
                    to="/rent-properties" 
                    className="text-xs text-primary hover:underline"
                >
                    View all
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProperties.map(property => (
                    <PropertyCard 
                        key={property._id} 
                        property={property}
                        compact
                    />
                ))}
            </div>
        </div>
    );
}


export default function RentPropertyDetail() {
    const [propertyData, setPropertyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);
    
    const navigate = useNavigate();
    const { slug } = useParams();
    const { createConversation } = useMessages();

    const formatDate = (timestamp) => {
        if (!timestamp) return null;
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return null;
        return new Intl.NumberFormat('en-IN').format(amount);
    };

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
            title: propertyData?.title || 'Rental Property',
            text: `Check out this rental property: ${propertyData?.title}`,
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

    // Handle message owner - "Contact Owner" CTA (Requirement 6.6)
    const handleMessage = async () => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        const ownerId = propertyData?.ownerId || propertyData?.owner?._id || propertyData?.owner;
        if (!ownerId || !propertyData?._id) return;

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser._id === ownerId || currentUser.id === ownerId) return;

        setIsCreatingConversation(true);
        try {
            const result = await createConversation(ownerId, propertyData._id);
            if (result.success) {
                const conversationId = result.data?._id || result.data?.id;
                navigate('/messages', { state: { conversationId } });
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setIsCreatingConversation(false);
        }
    };

    // Handle call
    const handleCall = () => {
        if (propertyData?.ownerPhone) {
            window.location.href = `tel:${propertyData.ownerPhone}`;
        }
    };

    // Fetch rent property via rent-specific endpoint (Requirement 6.1)
    const fetchProperty = useCallback(async () => {
        if (!slug) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await propertyService.getRentPropertyBySlug(slug);
            const data = response.data?.data || response.data;
            
            if (data) {
                // Verify this is a rent property
                if (data.listingType && data.listingType !== 'rent') {
                    setError(new Error('This property is listed for sale, not rent'));
                    return;
                }
                setPropertyData(data);
                checkWishlistStatus(data._id);
            } else {
                setError(new Error('Rental property not found'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [slug, checkWishlistStatus]);

    useEffect(() => {
        fetchProperty();
    }, [fetchProperty]);

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
                    error={error || { message: 'Rental property not found' }} 
                    onRetry={fetchProperty} 
                    onGoBack={() => navigate(-1)} 
                />
            </>
        );
    }

    const isRoomType = ['room', 'pg', 'hostel'].includes(propertyData.category);
    const addressParts = [propertyData.locality, propertyData.city].filter(Boolean);
    const shortAddress = addressParts.join(', ') || propertyData.address || 'Location not specified';

    // Get verification badge
    const getVerificationBadge = () => {
        const status = propertyData.verificationStatus?.toLowerCase();
        switch (status) {
            case 'verified':
                return { icon: CheckCircle, text: 'Verified', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' };
            case 'pending':
                return { icon: Clock, text: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' };
            default:
                return { icon: Shield, text: 'Listed', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
        }
    };

    const verification = getVerificationBadge();
    const VerificationIcon = verification.icon;

    // Quick specs for hero section
    const getQuickSpecs = () => {
        const specs = [];
        if (isRoomType) {
            if (propertyData.roomType) specs.push({ icon: Users, value: propertyData.roomType, label: 'Room', color: 'blue' });
            if (propertyData.bathroomType) specs.push({ icon: Bath, value: propertyData.bathroomType, label: 'Bath', color: 'emerald' });
        } else {
            if (propertyData.bedrooms) specs.push({ icon: Bed, value: propertyData.bedrooms, label: 'Beds', color: 'blue' });
            if (propertyData.bathrooms) specs.push({ icon: Bath, value: propertyData.bathrooms, label: 'Baths', color: 'emerald' });
        }
        if (propertyData.builtUpArea) specs.push({ icon: Maximize, value: propertyData.builtUpArea, label: 'Sq.ft', color: 'purple' });
        return specs.slice(0, 3);
    };

    const quickSpecs = getQuickSpecs();

    // Generate SEO data with rent-specific format (Requirement 9.3)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://renters.com';
    const propertyUrl = `${baseUrl}/rent/${propertyData.slug || slug}`;
    const seoTitle = `${propertyData.propertyType || propertyData.category || 'Property'} for Rent in ${propertyData.city || 'India'} | ${propertyData.title || 'Rental Property'}`;
    const seoDescription = propertyData.description 
        ? propertyData.description.substring(0, 155) + (propertyData.description.length > 155 ? '...' : '')
        : `${propertyData.category || 'Property'} for rent in ${shortAddress}. ${propertyData.bedrooms ? propertyData.bedrooms + ' bedrooms, ' : ''}${propertyData.monthlyRent ? '₹' + formatCurrency(propertyData.monthlyRent) + '/month' : 'Contact for price'}`;
    const seoImage = propertyData.photos?.[0] || '/property_image/placeholder-logo.png';

    // Generate breadcrumbs
    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Rent Properties', url: '/rent-properties' },
        { name: propertyData.title || 'Property', url: propertyUrl }
    ];

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                image={seoImage}
                url={propertyUrl}
                type="article"
            />
            <JsonLd data={[
                generatePropertySchema(propertyData),
                generateBreadcrumbs(breadcrumbItems)
            ]} />
            <Navbar />
            <div className="min-h-screen bg-background pb-20 lg:pb-0">
                
                {/* Mobile Header */}
                <div className="absolute top-16 left-0 right-0 z-30 px-3 py-2 flex items-center justify-between lg:hidden">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className={`p-2 rounded-full backdrop-blur-sm ${
                                isFavorited ? 'bg-red-500 text-white' : 'bg-black/40 text-white'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Image Gallery */}
                <div className="lg:max-w-7xl lg:mx-auto lg:px-6 lg:pt-6">
                    <ImageGallery
                        images={propertyData.photos || []}
                        title={propertyData.title || 'Rental Property'}
                    />
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:flex max-w-7xl mx-auto px-6 py-4 items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to rent listings
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2.5 rounded-full bg-card border border-border hover:bg-muted transition-all"
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
                        >
                            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-0">
                        
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-4">
                            
                            {/* Hero Section */}
                            <div className="space-y-3">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="bg-primary/10 text-primary border-0 text-xs">
                                        <Key className="w-3 h-3 mr-1" />
                                        For Rent
                                    </Badge>
                                    <Badge className={`${verification.className} border-0 text-xs`}>
                                        <VerificationIcon className="w-3 h-3 mr-1" />
                                        {verification.text}
                                    </Badge>
                                    {propertyData.category && (
                                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 text-xs capitalize">
                                            {propertyData.category}
                                        </Badge>
                                    )}
                                    {propertyData.propertyType && (
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {propertyData.propertyType}
                                        </Badge>
                                    )}
                                    {propertyData.furnishing && (
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {propertyData.furnishing === 'semi' ? 'Semi-Furnished' : 
                                             propertyData.furnishing === 'fully' ? 'Fully Furnished' : 'Unfurnished'}
                                        </Badge>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                                    {propertyData.title || 'Rental Property'}
                                </h1>

                                {/* Location */}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="text-sm">{shortAddress}</span>
                                </div>

                                {/* Price Card - Mobile */}
                                <div className="lg:hidden">
                                    <RentPriceDisplay property={propertyData} />
                                </div>

                                {/* Quick Specs */}
                                {quickSpecs.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {quickSpecs.map((spec, idx) => (
                                            <QuickSpec key={idx} {...spec} />
                                        ))}
                                    </div>
                                )}

                                {/* Availability */}
                                {propertyData.availableFrom && (
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="text-sm">
                                            <span className="text-muted-foreground">Available from </span>
                                            <span className="font-medium text-foreground">{formatDate(propertyData.availableFrom)}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {propertyData.description && (
                                <div className="bg-card rounded-xl border border-border p-4">
                                    <h3 className="text-sm font-semibold text-foreground mb-2">About this rental</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {propertyData.description}
                                    </p>
                                </div>
                            )}

                            {/* Property Details Grid */}
                            <PropertyDetailsGrid property={propertyData} isRoomType={isRoomType} />

                            {/* Amenities */}
                            <PropertyAmenities property={propertyData} />

                            {/* Location */}
                            <PropertyLocation property={propertyData} />

                            {/* Related Rent Properties (Requirement 6.5) */}
                            <RelatedRentProperties 
                                currentPropertyId={propertyData._id}
                                city={propertyData.city}
                                category={propertyData.category}
                            />

                            {/* Listing Info */}
                            {propertyData.listingNumber && (
                                <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-muted/30 rounded-xl text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <span>ID: <span className="font-mono text-foreground">{propertyData.listingNumber}</span></span>
                                        {propertyData.createdAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Posted {formatDate(propertyData.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    {propertyData.views > 0 && (
                                        <span>{propertyData.views} views</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sidebar (Desktop) */}
                        <div className="hidden lg:block space-y-4">
                            <div className="sticky top-6 space-y-4">
                            {/* Price Card */}
                                <RentPriceDisplay property={propertyData} />

                                {/* Owner Card - Contains all contact options */}
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
                                    propertyTitle={propertyData.title}
                                />

                                {/* Nearby Places */}
                                <NearbyPlaces 
                                    property={propertyData}
                                    location={propertyData.locality || propertyData.city}
                                />
                            </div>
                        </div>

                        {/* Mobile-only sections */}
                        <div className="lg:hidden space-y-4">
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
                                propertyTitle={propertyData.title}
                            />

                            {/* Nearby Places */}
                            <NearbyPlaces 
                                property={propertyData}
                                location={propertyData.locality || propertyData.city}
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile Sticky Contact Bar */}
                <MobileContactBar 
                    property={propertyData}
                    onMessage={handleMessage}
                    onCall={handleCall}
                    isCreatingConversation={isCreatingConversation}
                />
            </div>
            <Footer />
            <BackToTop />
        </>
    );
}
