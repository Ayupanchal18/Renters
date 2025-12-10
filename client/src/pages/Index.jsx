import { useState, useRef, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { MapPin, Search, Bed, Bath, Star, ArrowRight, Mail, CheckCircle2, Zap, Shield, Clock, Users, MailCheck, Sparkles, Heart, Share2, ChevronDown, DoorOpen, Building2, Users2, Sofa, PlusCircle, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { getAllProperties } from '../redux/slices/propertySlice';
import { useDispatch } from 'react-redux';

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
    const [errors, setErrors] = useState({
        location: "",
        type: "",
        query: ""
    });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const locationSuggestions = [
        'New York', 'Los Angeles', 'Chicago', 'San Francisco',
        'Miami', 'Boston', 'Austin', 'Seattle', 'Denver', 'Portland'
    ];

    const typeOptions = [
        { value: '1rk', label: '1 RK (Room + Kitchen)' },
        { value: '1bhk', label: '1 BHK (1 Bed + Hall + Kitchen)' },
        { value: 'pg', label: 'PG (Paying Guest)' },
        { value: 'shared', label: 'Shared Room' },
        { value: 'apartment', label: 'Apartment' },
        { value: 'flat', label: 'Flat' },
    ];
    const isSearchDisabled =
        !searchLocation.trim() &&
        !detectedCity.trim() &&
        !searchType.trim() &&
        !searchQuery.trim();

    // Enhanced location detection function
    const handleGetLocation = async () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setIsDetectingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        {
                            headers: {
                                'User-Agent': 'RoomHub/1.0'
                            }
                        }
                    );

                    const data = await response.json();

                    const city =
                        data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.county ||
                        data.address.state ||
                        "";

                    if (city) {
                        setSearchLocation(city);
                        setDetectedCity(city);
                        setShowLocationSuggestions(false);
                    } else {
                        alert("Unable to detect your city, please enter manually.");
                    }
                } catch (err) {
                    console.error("Location error:", err);
                    alert("Failed to detect location. Please try again or enter manually.");
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            (err) => {
                setIsDetectingLocation(false);
                if (err.code === 1) {
                    alert("Location permission denied. Please enable location access in your browser settings.");
                } else if (err.code === 2) {
                    alert("Location unavailable. Please check your device settings.");
                } else {
                    alert("Location request timeout. Please try again.");
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Enhanced search handler with all parameter
    // const handleSearch = () => {
    //     const finalLocation = searchLocation.trim() || detectedCity;

    //     const searchPayload = {
    //         location: finalLocation || "",
    //         type: searchType || "",
    //         query: searchQuery.trim() || ""
    //     };

    //     console.log("POST Search Payload:", searchPayload);

    //     // Navigate to listing page using state (NOT params)
    //     navigate("/listings", {
    //         state: {
    //             searchData: searchPayload
    //         }
    //     });
    // };
    const handleSearch = () => {
        const finalLocation = searchLocation.trim() || detectedCity.trim();

        // Validation
        let newErrors = {
            location: "",
            type: "",
            query: ""
        };

        if (!finalLocation) {
            newErrors.location = "Location is required";
        }
        if (!searchType.trim()) {
            newErrors.type = "Property type is required";
        }
        if (!searchQuery.trim()) {
            newErrors.query = "Search keywords are required";
        }

        setErrors(newErrors);

        // If any validation error exists → stop
        if (newErrors.location || newErrors.type || newErrors.query) {
            return; // ❌ Don't navigate
        }

        // If all fields are valid → proceed
        const searchPayload = {
            location: finalLocation,
            type: searchType,
            query: searchQuery.trim()
        };

        navigate("/listings", {
            state: { searchData: searchPayload }
        });
    };

    // Featured properties with property type classification
    const featuredProperties = [
        {
            id: 1,
            title: 'Modern Studio in Downtown',
            location: 'New York, NY',
            price: 1850,
            beds: 0,
            baths: 1,
            sqft: 450,
            type: '1rk',
            furnishing: 'fully',
            deposit: 1500,
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop',
            tags: ['Ready to Negotiate', 'Immediate Move-in'],
            rating: 4.8,
            reviews: 142,
        },
        {
            id: 2,
            title: 'Cozy 1BR with Balcony',
            location: 'Los Angeles, CA',
            price: 2100,
            beds: 1,
            baths: 1,
            sqft: 650,
            type: '1bhk',
            furnishing: 'semi',
            deposit: 2100,
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop',
            tags: ['Hassle-free Move', 'Pet Friendly'],
            rating: 4.9,
            reviews: 89,
        },
        {
            id: 3,
            title: 'Shared Space - Students',
            location: 'San Francisco, CA',
            price: 950,
            beds: 1,
            baths: 1,
            sqft: 300,
            type: 'shared',
            furnishing: 'fully',
            deposit: 950,
            image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=400&fit=crop',
            tags: ['Social Community', 'Furnished'],
            rating: 4.7,
            reviews: 156,
        },
        {
            id: 4,
            title: 'Bright 2BR Apartment',
            location: 'Chicago, IL',
            price: 1650,
            beds: 2,
            baths: 2,
            sqft: 900,
            type: '1bhk',
            furnishing: 'unfurnished',
            deposit: 1650,
            image: 'https://images.unsplash.com/photo-1502905917128-1aa500764cbd?w=500&h=400&fit=crop',
            tags: ['Ready to Negotiate', 'Utilities Included'],
            rating: 4.6,
            reviews: 203,
        },
        {
            id: 5,
            title: 'PG Room - Utilities Included',
            location: 'Miami, FL',
            price: 750,
            beds: 0,
            baths: 1,
            sqft: 250,
            type: 'pg',
            furnishing: 'fully',
            deposit: 750,
            image: 'https://images.unsplash.com/photo-1540932239986-310128078e38?w=500&h=400&fit=crop',
            tags: ['Meals Included', 'Community Space'],
            rating: 4.9,
            reviews: 78,
        },
        {
            id: 6,
            title: 'Modern 1RK Loft',
            location: 'Austin, TX',
            price: 1450,
            beds: 1,
            baths: 1,
            sqft: 550,
            type: '1rk',
            furnishing: 'fully',
            deposit: 1450,
            image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop',
            tags: ['Pet Friendly', 'Furnished'],
            rating: 4.8,
            reviews: 134,
        },
    ];

    const filteredProperties = selectedPropertyType === 'all'
        ? featuredProperties
        : featuredProperties.filter(p => p.type === selectedPropertyType);

    const whyChooseUs = [
        {
            icon: <Zap className="w-6 h-6" />,
            title: 'Lightning Fast Search',
            description: 'Find available rooms and apartments in seconds with our advanced filters tailored for renters like you.'
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: 'Verified Listings',
            description: 'Every listing is verified by our team. No scams, no hidden fees - just transparent rental information.'
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: 'Hassle-Free Process',
            description: 'From search to lease signing, we streamline the entire process. Move in faster with our guided steps.'
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: 'Active Community',
            description: 'Connect with other renters, get real reviews, and find roommates. Your housing journey doesn\'t have to be lonely.'
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: 'Post Your Property Easily',
            description: 'Landlords: Reach thousands of tenants with our simple listing process. Manage properties efficiently.'
        },
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: 'Expert Support',
            description: '24/7 support team ready to help. Renter or landlord? Lease confusion? We\'ve got your back.'
        },
    ];

    const testimonials = [
        {
            name: 'Alex Chen',
            role: 'Software Engineer',
            location: 'New York, NY',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            content: 'Found my perfect apartment in just 2 days! The search filters were so accurate. Finally in a place I actually love.',
            rating: 5,
            verified: true,
        },
        {
            name: 'Maya Rodriguez',
            role: 'Property Owner',
            location: 'San Francisco, CA',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
            content: 'Rented my apartment in 1 week! The platform is amazing for landlords. Great tenant quality and easy management.',
            rating: 5,
            verified: true,
        },
        {
            name: 'James Wilson',
            role: 'Recent Graduate',
            location: 'Austin, TX',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
            content: 'The roommate matching feature is incredible! Found amazing housemates and saved hundreds on rent.',
            rating: 5,
            verified: true,
        },
    ];

    const cities = [
        {
            name: 'New York',
            properties: 3420,
            image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
            avgRent: '$2,100'
        },
        {
            name: 'Los Angeles',
            properties: 2150,
            image: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400&h=300&fit=crop',
            avgRent: '$2,350'
        },
        {
            name: 'San Francisco',
            properties: 890,
            image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop',
            avgRent: '$3,200'
        },
        {
            name: 'Austin',
            properties: 1560,
            image: 'https://images.unsplash.com/photo-1544961051-7257542302f0?w=400&h=300&fit=crop',
            avgRent: '$1,600'
        },
    ];

    const getallProperties = async () => {
        setLoading(true);

        try {
            const response = await dispatch(getAllProperties());
            const data = response?.payload?.items || [];
            console.log(data);
            setProperties(data);
            setLoading(false);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getallProperties();
    }, []);

    // Handle Enter key press in search inputs
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
                {/* Hero Section with Advanced Search */}
                <section id='search_box' className="relative pt-12 pb-20 px-4 bg-gradient-to-b from-white via-emerald-50/30 to-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                                Find Your Perfect <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Place to Live</span>
                            </h1>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                                Search thousands of verified rooms and apartments. For renters, students, and landlords.
                            </p>
                        </div>

                        {/* Advanced Search Bar with All Filters */}
                        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200">
                            {/* Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                {/* Location Input with Autocomplete */}
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Location {detectedCity && !searchLocation && (
                                            <span className="text-xs font-normal text-emerald-600">(Auto-detected)</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                        <Input
                                            placeholder="City or neighborhood"
                                            value={searchLocation}
                                            onChange={(e) => {
                                                setSearchLocation(e.target.value);
                                                setShowLocationSuggestions(e.target.value.length > 0);
                                            }}
                                            onKeyPress={handleKeyPress}
                                            className="pl-10 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        />
                                        {errors.location && (
                                            <p className="text-red-600 text-xs mt-1">{errors.location}</p>
                                        )}

                                        {showLocationSuggestions && searchLocation && (
                                            <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                {locationSuggestions
                                                    .filter(loc => loc.toLowerCase().includes(searchLocation.toLowerCase()))
                                                    .map(loc => (
                                                        <button
                                                            key={loc}
                                                            onClick={() => {
                                                                setSearchLocation(loc);
                                                                setShowLocationSuggestions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-slate-700 transition flex items-center gap-2 hover:translate-x-1 duration-150"
                                                        >
                                                            <MapPin className="w-4 h-4 text-slate-400" />
                                                            {loc}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleGetLocation}
                                        disabled={isDetectingLocation}
                                        className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition hover:translate-x-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MailCheck className="w-3 h-3" />
                                        {isDetectingLocation ? 'Detecting...' : 'Use my location'}
                                    </button>
                                </div>

                                {/* Property Type Dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                            className="w-full h-11 px-3 border border-slate-300 rounded-lg text-left text-slate-700 hover:border-slate-400 transition flex items-center justify-between focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 group"
                                        >
                                            {searchType ? typeOptions.find(o => o.value === searchType)?.label : 'Select Type'}
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                                        </button>
                                        {errors.type && (
                                            <p className="text-red-600 text-xs mt-1">{errors.type}</p>
                                        )}

                                        {showTypeDropdown && (
                                            <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button
                                                    onClick={() => {
                                                        setSearchType('');
                                                        setShowTypeDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-slate-700 transition font-medium hover:pl-5 duration-150 border-b border-slate-100"
                                                >
                                                    All Types
                                                </button>
                                                {typeOptions.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSearchType(option.value);
                                                            setShowTypeDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-slate-700 transition font-medium hover:pl-5 duration-150"
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Search Query Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                        <Input
                                            placeholder="Keywords, amenities..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="pl-10 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        />
                                        {errors.query && (
                                            <p className="text-red-600 text-xs mt-1">{errors.query}</p>
                                        )}

                                    </div>
                                </div>

                                {/* Search Button */}
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleSearch}
                                        disabled={isSearchDisabled}
                                        className={`w-full h-11 text-white font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-300 ${isSearchDisabled
                                            ? "bg-slate-300 cursor-not-allowed"
                                            : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:scale-105"
                                            }`}
                                    >
                                        <Search className="w-5 h-5" />
                                        <span className="hidden sm:inline">Search</span>
                                    </Button>

                                </div>
                            </div>

                            {/* Search Info Display */}
                            {(searchLocation || detectedCity || searchType || searchQuery) && (
                                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <p className="text-sm text-emerald-800">
                                        <span className="font-semibold">Searching for:</span>
                                        {(searchLocation || detectedCity) && (
                                            <span className="ml-2">📍 {searchLocation || detectedCity}</span>
                                        )}
                                        {searchType && (
                                            <span className="ml-2">🏠 {typeOptions.find(o => o.value === searchType)?.label}</span>
                                        )}
                                        {searchQuery && (
                                            <span className="ml-2">🔍 "{searchQuery}"</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Quick Browse Tags */}
                            <div className="flex flex-wrap gap-2 border-t border-slate-200 mt-4 pt-4">
                                <span className="text-xs text-slate-500 font-semibold">POPULAR SEARCHES:</span>
                                {['Studio in NYC', 'Affordable Austin', '1BHK Shared', 'Pet Friendly LA'].map(tag => (
                                    <button
                                        key={tag}
                                        className="px-3 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 text-xs rounded-full transition hover:scale-105 duration-200"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Properties with Sidebar Filter */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Featured Listings</h2>
                                <p className="text-slate-600">Hand-picked rooms and apartments ready for you</p>
                            </div>
                            <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={() => navigate("/listings")}>
                                View All <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>

                        <div className="flex gap-6 flex-col md:flex-row">
                            {/* Sidebar Filter */}
                            <div className="md:w-48 flex-shrink-0">
                                <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 sticky top-20">
                                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-emerald-600" />
                                        Property Type
                                    </h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedPropertyType('all')}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg transition duration-200 font-medium flex items-center gap-2 ${selectedPropertyType === 'all'
                                                ? 'bg-emerald-600 text-white shadow-lg'
                                                : 'text-slate-700 hover:bg-white hover:text-emerald-600'
                                                }`}
                                        >
                                            All Properties
                                        </button>
                                        {typeOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setSelectedPropertyType(option.value)}
                                                className={`w-full text-left px-4 py-2.5 rounded-lg transition duration-200 font-medium flex items-center gap-2 ${selectedPropertyType === option.value
                                                    ? 'bg-emerald-600 text-white shadow-lg'
                                                    : 'text-slate-700 hover:bg-white hover:text-emerald-600'
                                                    }`}
                                            >
                                                <DoorOpen className="w-4 h-4" />
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Properties Grid */}
                            <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {properties.length > 0 ? (
                                        properties.map(property => (
                                            <div
                                                key={property.id}
                                                className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 flex flex-col hover:scale-105 hover:-translate-y-2"
                                            >
                                                {/* Image Container */}
                                                <div className="relative h-48 overflow-hidden bg-slate-200">
                                                    <img
                                                        src={
                                                            property?.photos.length >= 1
                                                                ? `http://localhost:8080${property.photos[0]}`
                                                                : "/placeholder.svg"
                                                        }
                                                        alt={property.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition shadow-md hover:scale-110 duration-200">
                                                        <Heart className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                                    </button>
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{property.title}</h3>
                                                    <div className="flex items-center text-slate-600 text-xs mb-3">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {property.address}
                                                    </div>

                                                    {/* Price and Details */}
                                                    <div className="mb-3">
                                                        <div className="text-2xl font-bold text-emerald-600 mb-2">${property.monthlyRent}/mo</div>
                                                    </div>

                                                    {/* Deposit & Furnishing Info */}
                                                    <div className="text-xs text-slate-600 mb-3 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="w-3 h-3 text-emerald-600" />
                                                            Deposit: ${property.securityDeposit}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Sofa className="w-3 h-3 text-emerald-600" />
                                                            {property.furnishing}
                                                        </div>
                                                    </div>

                                                    {/* Button */}
                                                    <Button
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-auto transition-all hover:shadow-lg"
                                                        onClick={() => navigate(`/properties/${property.slug}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-12">
                                            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-600">No properties found. Try adjusting your filters.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us - For Both Renters and Landlords */}
                <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose RoomHub?</h2>
                            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                                Whether you're searching for your next home or posting a property, we've got you covered.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {whyChooseUs.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-6 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all group hover:-translate-y-2 duration-300"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Browse by City */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Browse by City</h2>
                            <p className="text-slate-600">Explore available rentals in your favorite cities</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cities.map(city => (
                                <button
                                    key={city.name}
                                    onClick={() => {
                                        setSearchLocation(city.name);
                                        handleSearch();
                                    }}
                                    className="group relative h-56 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                                >
                                    <img
                                        src={city.image || "/placeholder.svg"}
                                        alt={city.name}
                                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex flex-col justify-end p-6">
                                        <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
                                        <div className="flex justify-between items-center text-white/90 text-sm">
                                            <span>{city.properties.toLocaleString()} listings</span>
                                            <span className="font-semibold bg-emerald-600/80 px-2 py-1 rounded">{city.avgRent} avg</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials - Interactive Cards */}
                <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Stories from Our Community</h2>
                            <p className="text-slate-600 text-lg">Real renters and landlords, real experiences</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl p-8 border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all group hover:-translate-y-2 duration-300"
                                >
                                    {/* Rating */}
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="w-5 h-5 fill-amber-400 text-amber-400"
                                            />
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <p className="text-slate-700 text-lg mb-6 leading-relaxed italic">
                                        "{testimonial.content}"
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                                        <img
                                            src={testimonial.image || "/placeholder.svg"}
                                            alt={testimonial.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                                                {testimonial.verified && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600">{testimonial.role} • {testimonial.location}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button className="flex-1 text-xs py-2 rounded-lg hover:bg-emerald-50 text-emerald-600 font-medium transition flex items-center justify-center gap-1">
                                            <Heart className="w-3 h-3" /> Helpful
                                        </button>
                                        <button className="flex-1 text-xs py-2 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition flex items-center justify-center gap-1">
                                            <Share2 className="w-3 h-3" /> Share
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section - Dual Purpose */}
                <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* For Renters */}
                            <div className="text-white">
                                <Users className="w-10 h-10 mb-3 text-emerald-100" />
                                <h3 className="text-2xl font-bold mb-3">Looking for a Place?</h3>
                                <p className="text-emerald-100 mb-6">
                                    Find your perfect apartment, room, or shared space. Browse thousands of verified listings with detailed filters.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-white text-emerald-600 hover:bg-slate-100 font-semibold"
                                    onClick={() => {
                                        document.getElementById("search_box")?.scrollIntoView({
                                            behavior: "smooth"
                                        });
                                    }}
                                >
                                    Start Searching Now
                                </Button>
                            </div>

                            {/* For Landlords */}
                            <div className="text-white">
                                <Building2 className="w-10 h-10 mb-3 text-emerald-100" />
                                <h3 className="text-2xl font-bold mb-3">Have a Property?</h3>
                                <p className="text-emerald-100 mb-6">
                                    List your property easily and reach thousands of qualified tenants. Manage everything from one dashboard.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-white text-emerald-600 hover:bg-slate-100 font-semibold"
                                    onClick={() => navigate("/post-property")}
                                >
                                    Post Your Property
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Newsletter */}
                <section className="py-16 px-4 bg-white">
                    <div className="max-w-2xl mx-auto text-center">
                        <Mail className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Stay Updated</h3>
                        <p className="text-slate-600 mb-6">Get alerts for new listings and rental tips delivered to your inbox</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 h-12 border-slate-300"
                            />
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 transition-all hover:shadow-lg hover:scale-105 duration-300">
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-slate-400 py-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <h4 className="font-semibold text-white mb-3">Browse</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:text-emerald-400 transition">Search Listings</a></li>
                                    <li><a href="#" className="hover:text-emerald-400 transition">Roommate Matching</a></li>
                                    <li><a href="#" className="hover:text-emerald-400 transition">Cities</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-3">For Landlords</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:text-emerald-400 transition">Post Property</a></li>
                                    <li><a href="#" className="hover:text-emerald-400 transition">Pricing</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-3">Learn</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:text-emerald-400 transition">Blog</a></li>
                                    <li><a href="#" className="hover:text-emerald-400 transition">Guides</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-3">Company</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:text-emerald-400 transition">About</a></li>
                                    <li><a href="#" className="hover:text-emerald-400 transition">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-slate-800 pt-8 text-center text-sm">
                            <p>&copy; 2025 RoomHub. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}