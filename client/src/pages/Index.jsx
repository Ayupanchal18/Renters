import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { FavoriteButton } from "../components/ui/favorite-button";
import { BackToTop } from "../components/ui/back-to-top";
import { 
    MapPin, Search, Star, ArrowRight, Mail, CheckCircle2, 
    Zap, Shield, Clock, Users, Sparkles, Heart, ChevronDown, 
    Building2, TrendingUp, Home as HomeIcon, Key, Compass, Phone, 
    MessageCircle, ArrowUpRight, Play, Quote
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { getAllProperties } from '../redux/slices/propertySlice';
import { useDispatch } from 'react-redux';
import wishlistService from '../api/wishlistService';
import { isAuthenticated } from '../utils/auth';
import { 
    HOMEPAGE_PROPERTY_TYPE_OPTIONS,
    filterPropertiesByType,
} from '../utils/propertyTypeStandardization';
import { 
    getCurrentLocation, 
    getLocationSuggestions,
} from '../utils/locationStandardization';
import { 
    validateSearchParameters, 
    convertToApiPayload 
} from '../utils/searchParameterStandardization';

export default function Home() {
    const [searchLocation, setSearchLocation] = useState('');
    const [detectedCity, setDetectedCity] = useState('');
    const [searchType, setSearchType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPropertyType, setSelectedPropertyType] = useState('all');
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [errors, setErrors] = useState({
        location: "",
        type: "",
        query: ""
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const getLocationSuggestionsForInput = (input) => {
        return getLocationSuggestions(input, 10).map(loc => loc.formatted);
    };

    const typeOptions = HOMEPAGE_PROPERTY_TYPE_OPTIONS;
    const isSearchDisabled =
        !searchLocation.trim() &&
        !detectedCity.trim() &&
        !searchType.trim() &&
        !searchQuery.trim();

    const handleGetLocation = async () => {
        setIsDetectingLocation(true);
        try {
            const location = await getCurrentLocation();
            if (location && location.formatted) {
                setSearchLocation(location.formatted);
                setDetectedCity(location.formatted);
                setShowLocationSuggestions(false);
                setErrors(prev => ({ ...prev, location: "" }));
            } else {
                alert("Unable to detect your city, please enter manually.");
            }
        } catch (error) {
            console.error("Location detection error:", error);
            alert(error.message || "Failed to detect location. Please try again or enter manually.");
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleSearch = () => {
        const finalLocation = searchLocation.trim() || detectedCity.trim();
        const searchParams = {
            location: finalLocation,
            propertyType: searchType,
            keywords: searchQuery.trim()
        };
        const validation = validateSearchParameters(searchParams);
        
        if (!validation.isValid) {
            setErrors({
                location: validation.errors.location || "",
                type: validation.errors.propertyType || "",
                query: validation.errors.keywords || ""
            });
            return;
        }
        const searchPayload = convertToApiPayload(validation.normalized);
        navigate("/listings", { state: { searchData: searchPayload } });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // Stats data
    const stats = [
        { value: '50K+', label: 'Active Listings', icon: HomeIcon },
        { value: '100K+', label: 'Happy Renters', icon: Users },
        { value: '500+', label: 'Cities Covered', icon: Compass },
        { value: '4.9', label: 'User Rating', icon: Star },
    ];

    // Why choose us features
    const features = [
        {
            icon: Zap,
            title: 'Instant Search',
            description: 'Find your perfect space in seconds with smart filters and AI-powered recommendations.',
            color: 'from-amber-500 to-orange-500'
        },
        {
            icon: Shield,
            title: 'Verified Listings',
            description: 'Every property is verified by our team. No scams, no surprises—just trusted rentals.',
            color: 'from-emerald-500 to-teal-500'
        },
        {
            icon: Clock,
            title: 'Quick Move-in',
            description: 'Streamlined process from search to keys. Most renters move in within 48 hours.',
            color: 'from-blue-500 to-indigo-500'
        },
        {
            icon: Users,
            title: 'Community First',
            description: 'Connect with roommates, read real reviews, and join a community of renters.',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: TrendingUp,
            title: 'Easy Listing',
            description: 'Landlords: List your property in minutes and reach thousands of qualified tenants.',
            color: 'from-rose-500 to-red-500'
        },
        {
            icon: Sparkles,
            title: '24/7 Support',
            description: 'Our dedicated team is always here to help with any questions or concerns.',
            color: 'from-cyan-500 to-blue-500'
        },
    ];

    // Testimonials
    const testimonials = [
        {
            name: 'Rahul Sharma',
            role: 'Software Engineer',
            location: 'Mumbai, Maharashtra',
            image: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=6366f1&color=fff&size=100',
            content: 'Found my dream apartment in just 2 days! The search filters were incredibly accurate. Finally living in a place I actually love.',
            rating: 5,
        },
        {
            name: 'Priya Patel',
            role: 'Property Owner',
            location: 'Bangalore, Karnataka',
            image: 'https://ui-avatars.com/api/?name=Priya+Patel&background=ec4899&color=fff&size=100',
            content: 'Rented my flat in just 1 week! The platform is amazing for landlords. Great tenant quality and super easy management.',
            rating: 5,
        },
        {
            name: 'Arjun Mehta',
            role: 'Graduate Student',
            location: 'Delhi, NCR',
            image: 'https://ui-avatars.com/api/?name=Arjun+Mehta&background=10b981&color=fff&size=100',
            content: 'The roommate matching feature is incredible! Found amazing flatmates and saved thousands on rent every month.',
            rating: 5,
        },
    ];

    // Cities
    const cities = [
        { name: 'Mumbai', properties: 4520, image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=300&fit=crop', avgRent: '₹25,000' },
        { name: 'Delhi', properties: 3850, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop', avgRent: '₹20,000' },
        { name: 'Bangalore', properties: 3200, image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=300&fit=crop', avgRent: '₹22,000' },
        { name: 'Hyderabad', properties: 2150, image: 'https://images.unsplash.com/photo-1572638029678-d0beee1bb64d?w=400&h=300&fit=crop', avgRent: '₹18,000' },
    ];

    // Fetch wishlist IDs for the current user
    const fetchWishlistIds = useCallback(async () => {
        if (!isAuthenticated()) return;
        try {
            const wishlist = await wishlistService.getWishlist();
            const ids = new Set(wishlist.map(item => item.property?._id || item.property));
            setWishlistIds(ids);
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        }
    }, []);

    const getallProperties = async () => {
        setLoading(true);
        try {
            const response = await dispatch(getAllProperties());
            const data = response?.payload?.items || [];
            setProperties(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getallProperties();
        fetchWishlistIds();
    }, [fetchWishlistIds]);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <section id="search_box" className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                    
                    {/* Floating Elements */}
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-16 sm:pb-24">
                        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12">
                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-8">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Trusted by 100,000+ renters</span>
                            </div>
                            
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight">
                                Find Your Perfect
                                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                                    Place to Call Home
                                </span>
                            </h1>
                            
                            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Discover thousands of verified rooms, apartments, and shared spaces. 
                                Your next home is just a search away.
                            </p>
                        </div>

                        {/* Search Card */}
                        <div className="max-w-5xl mx-auto relative z-30">
                            <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-4 sm:p-8">
                                {/* Main Search Row */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    {/* Location */}
                                    <div className="md:col-span-4">
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Location
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                placeholder="City or neighborhood"
                                                value={searchLocation}
                                                onChange={(e) => {
                                                    setSearchLocation(e.target.value);
                                                    setShowLocationSuggestions(e.target.value.length > 0);
                                                    if (errors.location) setErrors(prev => ({ ...prev, location: "" }));
                                                }}
                                                onKeyPress={handleKeyPress}
                                                className="pl-10 pr-10 h-12 bg-background border-border/50 focus:border-primary"
                                            />
                                            {/* Use My Location Button */}
                                            <button
                                                type="button"
                                                onClick={handleGetLocation}
                                                disabled={isDetectingLocation}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                                title="Use my current location"
                                            >
                                                {isDetectingLocation ? (
                                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                ) : (
                                                    <Compass className="w-5 h-5" />
                                                )}
                                            </button>
                                            {errors.location && (
                                                <p className="text-destructive text-xs mt-1 absolute">{errors.location}</p>
                                            )}
                                            {showLocationSuggestions && searchLocation && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                                                    {getLocationSuggestionsForInput(searchLocation).map(loc => (
                                                        <button
                                                            key={loc}
                                                            onClick={() => {
                                                                setSearchLocation(loc);
                                                                setShowLocationSuggestions(false);
                                                                setErrors(prev => ({ ...prev, location: "" }));
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-muted text-popover-foreground transition-colors flex items-center gap-3"
                                                        >
                                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                                            <span>{loc}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Property Type */}
                                    <div className={`md:col-span-3 ${showTypeDropdown ? 'relative z-50' : 'relative z-20'}`}>
                                        <label className="block text-sm font-medium text-foreground mb-2">Property Type</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                                className="w-full h-12 px-4 bg-background border border-border/50 rounded-lg text-left text-foreground hover:border-primary/50 transition-colors flex items-center justify-between"
                                            >
                                                <span className={searchType ? 'text-foreground' : 'text-muted-foreground'}>
                                                    {searchType ? typeOptions.find(o => o.value === searchType)?.label : 'Select type'}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showTypeDropdown && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                                                    <button
                                                        onClick={() => { setSearchType(''); setShowTypeDropdown(false); }}
                                                        className="w-full text-left px-4 py-3 hover:bg-muted text-popover-foreground transition-colors font-medium border-b border-border"
                                                    >
                                                        All Types
                                                    </button>
                                                    {typeOptions.map((option, idx) => (
                                                        <button
                                                            key={`${option.value}-${idx}`}
                                                            onClick={() => { setSearchType(option.value); setShowTypeDropdown(false); }}
                                                            className="w-full text-left px-4 py-3 hover:bg-muted text-popover-foreground transition-colors"
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-foreground mb-2">Keywords</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                placeholder="Amenities, features..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                className="pl-10 h-12 bg-background border-border/50 focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* Search Button */}
                                    <div className="md:col-span-2">
                                        <Button
                                            onClick={handleSearch}
                                            disabled={isSearchDisabled}
                                            className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:shadow-none"
                                        >
                                            <Search className="w-5 h-5 mr-2" />
                                            Search
                                        </Button>
                                    </div>
                                </div>

                                {/* Popular Searches */}
                                <div className="hidden sm:flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground font-medium">Popular:</span>
                                    {['Studio NYC', '1BHK LA', 'Pet Friendly', 'Near Metro'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setSearchQuery(tag)}
                                            className="px-3 py-1.5 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs rounded-full transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-8 sm:mt-12 max-w-4xl mx-auto">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="text-center p-3 sm:p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                                    <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                                    <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Properties Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Featured Listings</h2>
                                <p className="text-muted-foreground">Hand-picked properties ready for you</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground group"
                                onClick={() => navigate("/listings")}
                            >
                                View All
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>

                        {/* Property Type Filter */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            <button
                                onClick={() => setSelectedPropertyType('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    selectedPropertyType === 'all'
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                        : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                                }`}
                            >
                                All Properties
                            </button>
                            {typeOptions.slice(0, 4).map((option, idx) => (
                                <button
                                    key={`filter-${option.value}-${idx}`}
                                    onClick={() => setSelectedPropertyType(option.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        selectedPropertyType === option.value
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                // Loading skeletons
                                [...Array(6)].map((_, idx) => (
                                    <div key={idx} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                                        <div className="h-48 bg-muted" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-5 bg-muted rounded w-3/4" />
                                            <div className="h-4 bg-muted rounded w-1/2" />
                                            <div className="h-8 bg-muted rounded w-1/3" />
                                        </div>
                                    </div>
                                ))
                            ) : (() => {
                                const filteredProperties = selectedPropertyType === 'all' 
                                    ? properties 
                                    : filterPropertiesByType(properties, selectedPropertyType, 'homepage');
                                
                                return filteredProperties.length > 0 ? (
                                    filteredProperties.slice(0, 6).map((property, index) => (
                                    <div
                                        key={property.id || property._id || `property-${index}`}
                                        className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                                        onClick={() => navigate(`/properties/${property.slug}`)}
                                    >
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden bg-muted">
                                            <img
                                                src={property?.photos?.length >= 1 ? property.photos[0] : "/placeholder.svg"}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            {/* Wishlist Button */}
                                            <FavoriteButton
                                                propertyId={property._id}
                                                initialSaved={wishlistIds.has(property._id)}
                                                size="default"
                                                variant="floating"
                                                className="absolute top-3 right-3"
                                                onToggle={(isFavorited) => {
                                                    setWishlistIds(prev => {
                                                        const newSet = new Set(prev);
                                                        if (isFavorited) {
                                                            newSet.add(property._id);
                                                        } else {
                                                            newSet.delete(property._id);
                                                        }
                                                        return newSet;
                                                    });
                                                }}
                                            />
                                            
                                            {/* Property Type Badge */}
                                            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                                                {property.propertyType || property.category || 'Property'}
                                            </Badge>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                {property.title}
                                            </h3>
                                            <div className="flex items-center text-muted-foreground text-sm mb-4">
                                                <MapPin className="w-4 h-4 mr-1.5 text-primary/70" />
                                                <span className="line-clamp-1">{property.address || property.locality || property.city}</span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-baseline gap-1 mb-4">
                                                <span className="text-2xl font-bold text-primary">₹{property.monthlyRent?.toLocaleString()}</span>
                                                <span className="text-muted-foreground text-sm">/month</span>
                                            </div>

                                            {/* Features */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield className="w-4 h-4 text-emerald-500" />
                                                    <span>₹{property.securityDeposit?.toLocaleString()} deposit</span>
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <Button
                                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/properties/${property.slug}`);
                                                }}
                                            >
                                                View Details
                                                <ArrowUpRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                                ) : (
                                    <div className="col-span-full text-center py-16">
                                        <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            {selectedPropertyType === 'all' ? 'No properties found' : `No ${typeOptions.find(o => o.value === selectedPropertyType)?.label || selectedPropertyType} properties found`}
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            {selectedPropertyType === 'all' 
                                                ? 'Check back later for new listings.' 
                                                : 'Try selecting a different property type.'}
                                        </p>
                                        {selectedPropertyType !== 'all' && (
                                            <button
                                                onClick={() => setSelectedPropertyType('all')}
                                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                                            >
                                                View all properties
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <Badge className="mb-4 bg-primary/10 text-primary border-0">Why RoomHub</Badge>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Everything You Need to Find Home
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Whether you're searching for your next home or listing a property, we make it simple.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Browse by City Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Explore Popular Cities</h2>
                            <p className="text-muted-foreground">Find rentals in your favorite locations</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cities.map((city, idx) => (
                                <button
                                    key={city.name}
                                    onClick={() => {
                                        setSearchLocation(city.name);
                                        navigate("/listings", { state: { searchData: { location: city.name } } });
                                    }}
                                    className="group relative h-64 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                                >
                                    <img
                                        src={city.image || "/placeholder.svg"}
                                        alt={city.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                    
                                    {/* Content */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                                        <h3 className="text-2xl font-bold text-white mb-2">{city.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/80 text-sm">{city.properties.toLocaleString()} listings</span>
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm font-medium">
                                                {city.avgRent} avg
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Arrow */}
                                    <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <ArrowUpRight className="w-5 h-5 text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <Badge className="mb-4 bg-secondary/10 text-secondary border-0">Testimonials</Badge>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Loved by Thousands
                            </h2>
                            <p className="text-muted-foreground">Real stories from our community</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {testimonials.map((testimonial, idx) => (
                                <div
                                    key={idx}
                                    className={`p-8 rounded-2xl border transition-all duration-500 ${
                                        activeTestimonial === idx
                                            ? 'bg-primary/5 border-primary/30 shadow-lg scale-[1.02]'
                                            : 'bg-card border-border hover:border-primary/20'
                                    }`}
                                >
                                    {/* Quote Icon */}
                                    <Quote className={`w-10 h-10 mb-4 ${activeTestimonial === idx ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                    
                                    {/* Rating */}
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>

                                    {/* Content */}
                                    <p className="text-foreground text-lg leading-relaxed mb-6">
                                        "{testimonial.content}"
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-4 pt-6 border-t border-border">
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-foreground">{testimonial.name}</p>
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{testimonial.role} • {testimonial.location}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial Indicators */}
                        <div className="flex justify-center gap-2 mt-8">
                            {testimonials.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTestimonial(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        activeTestimonial === idx ? 'w-8 bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                    
                    <div className="max-w-6xl mx-auto relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            {/* For Renters */}
                            <div className="text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur mb-6">
                                    <Key className="w-4 h-4 text-white" />
                                    <span className="text-sm font-medium text-white">For Renters</span>
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                    Find Your Dream Home Today
                                </h3>
                                <p className="text-white/80 text-lg mb-8 leading-relaxed">
                                    Browse thousands of verified listings with detailed filters. Your perfect space is waiting.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-card text-foreground hover:bg-card/90 font-semibold shadow-xl border border-border/20"
                                    onClick={() => document.getElementById("search_box")?.scrollIntoView({ behavior: "smooth" })}
                                >
                                    Start Searching
                                    <Search className="w-5 h-5 ml-2" />
                                </Button>
                            </div>

                            {/* For Landlords */}
                            <div className="text-center md:text-left md:border-l md:border-white/20 md:pl-12">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur mb-6">
                                    <Building2 className="w-4 h-4 text-white" />
                                    <span className="text-sm font-medium text-white">For Landlords</span>
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                    List Your Property Free
                                </h3>
                                <p className="text-white/80 text-lg mb-8 leading-relaxed">
                                    Reach thousands of qualified tenants. Easy listing, powerful management tools.
                                </p>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/80 text-white hover:bg-card hover:text-foreground hover:border-card font-semibold"
                                    onClick={() => navigate("/post-property")}
                                >
                                    Post Property
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Newsletter Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Stay in the Loop</h3>
                        <p className="text-muted-foreground mb-8">
                            Get notified about new listings and rental tips delivered to your inbox.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="h-12 bg-card border border-border text-foreground placeholder:text-muted-foreground flex-1"
                            />
                            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25">
                                Subscribe
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            No spam, unsubscribe anytime.
                        </p>
                    </div>
                </section>

                <Footer />
                <BackToTop />
            </div>
        </>
    );
}
