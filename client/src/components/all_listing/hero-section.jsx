// import { useState, useEffect, useRef } from "react";
// import {
//     Search,
//     MapPin,
//     Loader2,
//     Crosshair,
//     ChevronDown
// } from "lucide-react";

// // Mock data for autocomplete suggestions
// const MOCK_SUGGESTIONS = [
//     { id: 1, text: "New York, NY", type: "location" },
//     { id: 2, text: "Los Angeles, CA", type: "location" },
//     { id: 3, text: "Modern Apartment in Downtown", type: "keyword" },
//     { id: 4, text: "3 BHK Family House", type: "keyword" },
//     { id: 5, text: "Sunnyvale, CA", type: "location" },
//     { id: 6, text: "Studio near University", type: "keyword" },
// ];

// export function HeroSection({ onSearch }) {
//     // --- State Management ---
//     const [activeTab, setActiveTab] = useState("rent"); // rent, buy, commercial

//     // Universal Search State
//     const [searchQuery, setSearchQuery] = useState("");
//     const [suggestions, setSuggestions] = useState([]);
//     const [showSuggestions, setShowSuggestions] = useState(false);
//     const [isLocating, setIsLocating] = useState(false);
//     const searchWrapperRef = useRef(null);

//     // Filters State
//     const [propertyType, setPropertyType] = useState("All Types");
//     const [budget, setBudget] = useState({ min: "", max: "" });

//     // Dropdown Visibility States
//     const [openDropdown, setOpenDropdown] = useState(null); // 'type', 'budget', or null

//     // --- Handlers ---

//     // 1. Handle Universal Search Input & Autocomplete
//     const handleSearchInput = (e) => {
//         const val = e.target.value;
//         setSearchQuery(val);

//         if (val.length > 1) {
//             const filtered = MOCK_SUGGESTIONS.filter(item =>
//                 item.text.toLowerCase().includes(val.toLowerCase())
//             );
//             setSuggestions(filtered);
//             setShowSuggestions(true);
//         } else {
//             setShowSuggestions(false);
//         }
//     };

//     const handleSelectSuggestion = (text) => {
//         setSearchQuery(text);
//         setShowSuggestions(false);
//     };

//     // 2. Real Geolocation Logic (Reverse Geocoding)
//     const handleUseMyLocation = () => {
//         if (!navigator.geolocation) {
//             alert("Geolocation is not supported by your browser");
//             return;
//         }

//         setIsLocating(true);

//         navigator.geolocation.getCurrentPosition(
//             async (position) => {
//                 const { latitude, longitude } = position.coords;
//                 try {
//                     // Using a free reverse geocoding API (BigDataCloud) for demo purposes
//                     // In production, you might use Google Maps API or Mapbox
//                     const response = await fetch(
//                         `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
//                     );
//                     const data = await response.json();

//                     // Construct a readable location string
//                     const city = data.city || data.locality || "";
//                     const state = data.principalSubdivision || "";
//                     const locationString = `${city},${state}`;

//                     setSearchQuery(locationString);
//                     setIsLocating(false);
//                 } catch (error) {
//                     console.error("Error fetching location:", error);
//                     setIsLocating(false);
//                 }
//             },
//             (error) => {
//                 console.error("Geolocation error:", error);
//                 setIsLocating(false);
//                 alert("Unable to retrieve your location.");
//             }
//         );
//     };

//     // 3. Close dropdowns when clicking outside
//     useEffect(() => {
//         function handleClickOutside(event) {
//             if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
//                 setOpenDropdown(null);
//                 setShowSuggestions(false);
//             }
//         }
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     // 4. Final Search Trigger
//     const handleSearchSubmit = () => {
//         if (onSearch) {
//             onSearch({
//                 query: searchQuery,
//                 type: propertyType,
//                 budget: budget,
//                 mode: activeTab
//             });
//         }
//         setOpenDropdown(null);
//     };

//     return (
//         <section className="relative w-full min-h-[250px] flex flex-col items-center justify-center text-white overflow-hidden">

//             {/* Background Image with Overlay */}
//             <div className="absolute inset-0 z-0">
//                 <img
//                     src="https://images.unsplash.com/photo-1600596542815-600025513036?q=80&w=2000&auto=format&fit=crop"
//                     alt="Real Estate Background"
//                     className="w-full h-full object-cover"
//                 />
//                 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
//             </div>

//             {/* Content Container */}
//             <div className="relative z-10 w-full max-w-5xl px-4 md:px-6 space-y-8 z-50">

//                 {/* Main Search Component */}
//                 <div ref={searchWrapperRef} className="bg-white rounded-2xl shadow-2xl p-2 md:p-3 max-w-4xl mx-auto text-slate-800">

//                     {/* Tabs (Rent/Buy/Commercial) */}
//                     <div className="flex gap-2 mb-3 px-2 overflow-x-auto scrollbar-hide">
//                         {['rent', 'buy', 'commercial'].map((tab) => (
//                             <button
//                                 key={tab}
//                                 onClick={() => setActiveTab(tab)}
//                                 className={`
//                                     px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize whitespace-nowrap
//                                    ${activeTab === tab
//                                         ? 'bg-slate-900 text-white shadow-md'
//                                         : 'bg-transparent text-slate-500 hover:bg-slate-100'}
//                                 `}
//                             >
//                                 {tab}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Search Bar Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-12 gap-2 relative">

//                         {/* 1. Universal Search Input (Spans 5 columns) */}
//                         <div className="md:col-span-5 relative group">
//                             <div className={`
//                                 flex items-center px-4 h-14 bg-slate-50 rounded-xl border-2 transition-all
//                                ${showSuggestions ? 'border-indigo-500 rounded-b-none' : 'border-transparent group-hover:border-slate-200'}
//                             `}>
//                                 <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
//                                 <div className="flex-1">
//                                     <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-[-2px]">
//                                         Location or Keyword
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={searchQuery}
//                                         onChange={handleSearchInput}
//                                         placeholder="City, Locality, or '3 BHK'"
//                                         className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 focus:ring-0 placeholder:text-slate-400 truncate outline-none"
//                                     />
//                                 </div>

//                                 {/* Use Location Button */}
//                                 <button
//                                     onClick={handleUseMyLocation}
//                                     disabled={isLocating}
//                                     title="Use my current location"
//                                     className="p-2 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors"
//                                 >
//                                     {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
//                                 </button>
//                             </div>

//                             {/* Autocomplete Dropdown */}
//                             {showSuggestions && (
//                                 <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-indigo-100 rounded-b-xl shadow-xl z-50 overflow-hidden">
//                                     {suggestions.length > 0 ? (
//                                         suggestions.map((item) => (
//                                             <button
//                                                 key={item.id}
//                                                 onClick={() => handleSelectSuggestion(item.text)}
//                                                 className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0"
//                                             >
//                                                 {item.type === 'location' ? <MapPin className="w-4 h-4 text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
//                                                 {item.text}
//                                             </button>
//                                         ))
//                                     ) : (
//                                         <div className="p-4 text-sm text-slate-400 text-center">No suggestions found</div>
//                                     )}
//                                 </div>
//                             )}
//                         </div>

//                         {/* 2. Property Type Select (Spans 3 columns) */}
//                         <div className="md:col-span-3 relative">
//                             <button
//                                 onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
//                                 className={`
//                                     w-full flex items-center px-4 h-14 bg-slate-50 rounded-xl border-2 text-left transition-all
//                                    ${openDropdown === 'type' ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'}
//                                 `}
//                             >
//                                 <div className="flex-1 overflow-hidden">
//                                     <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-[-2px]">
//                                         Property Type
//                                     </label>
//                                     <div className="text-sm font-semibold text-slate-900 truncate">{propertyType}</div>
//                                 </div>
//                                 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform${openDropdown === 'type' ? 'rotate-180' : ''}`} />
//                             </button>

//                             {/* Type Dropdown Content */}
//                             {openDropdown === 'type' && (
//                                 <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
//                                     {["All Types", "Apartment", "House", "Villa", "Commercial", "PG / Co-living"].map((type) => (
//                                         <button
//                                             key={type}
//                                             onClick={() => { setPropertyType(type); setOpenDropdown(null); }}
//                                             className={`
//                                                 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
//                                                ${propertyType === type ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
//                                             `}
//                                         >
//                                             {type}
//                                             {propertyType === type && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
//                                         </button>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>

//                         {/* 3. Budget Select (Spans 3 columns) */}
//                         <div className="md:col-span-3 relative">
//                             <button
//                                 onClick={() => setOpenDropdown(openDropdown === 'budget' ? null : 'budget')}
//                                 className={`
//                                     w-full flex items-center px-4 h-14 bg-slate-50 rounded-xl border-2 text-left transition-all
//                                    ${openDropdown === 'budget' ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'}
//                                 `}
//                             >
//                                 <div className="flex-1 overflow-hidden">
//                                     <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-[-2px]">
//                                         Budget
//                                     </label>
//                                     <div className="text-sm font-semibold text-slate-900 truncate">
//                                         {budget.min && budget.max ? `$${budget.min} -$${budget.max}` : "Any Price"}
//                                     </div>
//                                 </div>
//                                 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform${openDropdown === 'budget' ? 'rotate-180' : ''}`} />
//                             </button>

//                             {/* Budget Dropdown Content */}
//                             {openDropdown === 'budget' && (
//                                 <div className="absolute top-[calc(100%+8px)] right-0 md:right-auto w-full md:w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
//                                     <h3 className="text-sm font-bold text-slate-900 mb-3">Price Range</h3>
//                                     <div className="flex items-center gap-3 mb-4">
//                                         <div className="relative flex-1">
//                                             <span className="absolute left-3 top-2.5 text-slate-400 text-xs">$</span>
//                                             <input
//                                                 type="number"
//                                                 placeholder="Min"
//                                                 value={budget.min}
//                                                 onChange={(e) => setBudget({ ...budget, min: e.target.value })}
//                                                 className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
//                                             />
//                                         </div>
//                                         <span className="text-slate-400">-</span>
//                                         <div className="relative flex-1">
//                                             <span className="absolute left-3 top-2.5 text-slate-400 text-xs">$</span>
//                                             <input
//                                                 type="number"
//                                                 placeholder="Max"
//                                                 value={budget.max}
//                                                 onChange={(e) => setBudget({ ...budget, max: e.target.value })}
//                                                 className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
//                                             />
//                                         </div>
//                                     </div>
//                                     <div className="flex justify-end">
//                                         <button
//                                             onClick={() => setOpenDropdown(null)}
//                                             className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
//                                         >
//                                             Apply
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         {/* 4. Search Button (Spans 1 column on desktop) */}
//                         <div className="md:col-span-1">
//                             <button
//                                 onClick={handleSearchSubmit}
//                                 className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 flex items-center justify-center md:px-0 transition-colors"
//                             >
//                                 <Search className="w-5 h-5" />
//                                 <span className="md:hidden ml-2 font-bold">Search</span>
//                             </button>
//                         </div>

//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// }


import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Search,
    MapPin,
    Loader2,
    Crosshair,
    ChevronDown,
    Clock,
    X,
    AlertCircle
} from "lucide-react";
import { 
    getSearchSuggestions, 
    getRecentSearches, 
    addToSearchHistory,
    clearSuggestions,
    setCurrentQuery
} from "../../redux/slices/searchSlice";
import searchService from "../../api/searchService";
import { 
    FILTER_PROPERTY_TYPE_OPTIONS, 
    normalizePropertyType, 
    getPropertyTypeLabel 
} from "../../utils/propertyTypeStandardization";
import { 
    getCurrentLocation, 
    validateLocationInput, 
    getLocationSuggestions,
    formatLocationForDisplay 
} from "../../utils/locationStandardization";
import { 
    validateSearchParameters, 
    normalizeSearchParameters, 
    convertToApiPayload 
} from "../../utils/searchParameterStandardization";

// Mock data for autocomplete suggestions (fallback)
const MOCK_SUGGESTIONS = [
    { id: 1, text: "New York, NY", type: "location" },
    { id: 2, text: "Los Angeles, CA", type: "location" },
    { id: 3, text: "Modern Apartment in Downtown", type: "keyword" },
    { id: 4, text: "3 BHK Family House", type: "keyword" },
    { id: 5, text: "Sunnyvale, CA", type: "location" },
    { id: 6, text: "Studio near University", type: "keyword" },
];

export function HeroSection({ onSearch }) {
    const dispatch = useDispatch();
    const { 
        searchSuggestions, 
        isSuggestionsLoading, 
        recentSearches, 
        searchHistory 
    } = useSelector(state => state.searchResults);

    // --- State Management ---
    const [activeTab, setActiveTab] = useState("rent"); // rent, buy, commercial

    // Universal Search State (we treat this as Location)
    const [locationInput, setLocationInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const searchWrapperRef = useRef(null);
    const suggestionTimeoutRef = useRef(null);

    // Filters State
    const [propertyType, setPropertyType] = useState("All Types");
    // REPLACED budget with keywordInput
    const [keywordInput, setKeywordInput] = useState("");

    // Dropdown Visibility States
    const [openDropdown, setOpenDropdown] = useState(null); // 'type' or null

    // Validation errors
    const [errors, setErrors] = useState({ location: "", type: "", query: "" });
    
    // Input validation states
    const [inputValidation, setInputValidation] = useState({
        location: { isValid: true, message: "" },
        keywords: { isValid: true, message: "" }
    });

    // --- Handlers ---

    // Real-time input validation using standardized validation
    const validateLocationInputLocal = (value) => {
        const validation = validateLocationInput(value);
        return {
            isValid: validation.isValid,
            message: validation.error || ""
        };
    };

    const validateKeywordInput = (value) => {
        if (!value.trim()) {
            return { isValid: false, message: "Keywords are required" };
        }
        if (value.length < 2) {
            return { isValid: false, message: "Keywords must be at least 2 characters" };
        }
        if (value.length > 200) {
            return { isValid: false, message: "Keywords must be less than 200 characters" };
        }
        
        // Use the search service validation
        const validation = searchService.validateQuery(value);
        if (!validation.isValid) {
            return { isValid: false, message: validation.errors[0] };
        }
        
        return { isValid: true, message: "" };
    };

    // 1. Handle Location Input & Autocomplete with validation
    const handleLocationInput = (e) => {
        const val = e.target.value;
        setLocationInput(val);

        // Real-time validation
        const validation = validateLocationInputLocal(val);
        setInputValidation(prev => ({
            ...prev,
            location: validation
        }));

        // Clear previous errors
        setErrors(prev => ({ ...prev, location: "" }));

        // Clear existing timeout
        if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current);
        }

        // Debounced suggestion fetching
        if (val.length > 1) {
            suggestionTimeoutRef.current = setTimeout(() => {
                // Try to get suggestions from Redux store first
                dispatch(getSearchSuggestions(val));
                
                // Use standardized location suggestions
                const locationSuggestions = getLocationSuggestions(val, 5).map(loc => ({
                    id: `loc-${loc.city}-${loc.state}`,
                    text: loc.formatted,
                    type: 'location'
                }));
                
                // Combine with mock keyword suggestions
                const keywordSuggestions = MOCK_SUGGESTIONS.filter(item =>
                    item.text.toLowerCase().includes(val.toLowerCase()) && item.type !== 'location'
                );
                
                setSuggestions([...locationSuggestions, ...keywordSuggestions]);
                setShowSuggestions(true);
                setShowRecentSearches(false);
            }, 300); // 300ms debounce
        } else {
            setShowSuggestions(false);
            // Show recent searches when input is empty and focused
            if (val.length === 0) {
                setShowRecentSearches(true);
                dispatch(getRecentSearches());
            }
        }
    };

    // Handle keyword input with validation
    const handleKeywordInput = (e) => {
        const val = e.target.value;
        setKeywordInput(val);

        // Real-time validation
        const validation = validateKeywordInput(val);
        setInputValidation(prev => ({
            ...prev,
            keywords: validation
        }));

        // Clear previous errors
        setErrors(prev => ({ ...prev, query: "" }));
    };

    const handleSelectSuggestion = (text, type = 'suggestion') => {
        if (type === 'recent') {
            // For recent searches, populate both location and keywords
            const recentSearch = searchHistory.find(search => 
                search.query === text || search.location === text
            );
            if (recentSearch) {
                setLocationInput(recentSearch.location || text);
                setKeywordInput(recentSearch.query || "");
            } else {
                setLocationInput(text);
            }
        } else {
            setLocationInput(text);
        }
        
        setShowSuggestions(false);
        setShowRecentSearches(false);
        setErrors(prev => ({ ...prev, location: "" }));
        
        // Update current query in Redux
        dispatch(setCurrentQuery({ 
            query: keywordInput, 
            location: text 
        }));
    };

    // Handle input focus to show recent searches
    const handleLocationFocus = () => {
        if (locationInput.length === 0) {
            setShowRecentSearches(true);
            setShowSuggestions(false);
            dispatch(getRecentSearches());
        }
    };

    // 2. Real Geolocation Logic using standardized service
    const handleUseMyLocation = async () => {
        setIsLocating(true);

        try {
            const location = await getCurrentLocation();
            
            if (location && location.formatted) {
                setLocationInput(location.formatted);
                setErrors(prev => ({ ...prev, location: "" }));
                setInputValidation(prev => ({
                    ...prev,
                    location: { isValid: true, message: "" }
                }));
            } else {
                alert("Unable to detect your city, please enter manually.");
            }
        } catch (error) {
            console.error("Location detection error:", error);
            alert(error.message || "Unable to retrieve your location.");
        } finally {
            setIsLocating(false);
        }
    };

    // 3. Close dropdowns when clicking outside and cleanup
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setOpenDropdown(null);
                setShowSuggestions(false);
                setShowRecentSearches(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            // Clear any pending timeouts
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
            }
        };
    }, []);

    // Load recent searches on component mount
    useEffect(() => {
        dispatch(getRecentSearches());
    }, [dispatch]);

    // 4. Final Search Trigger with enhanced validation
    const handleSearchSubmit = () => {
        // Create search parameters in standard format
        const searchParams = {
            location: (locationInput || "").toString().trim(),
            propertyType: propertyType === "All Types" ? "" : (propertyType || "").toString().trim(),
            keywords: (keywordInput || "").toString().trim()
        };

        // Validate using standardized validation
        const validation = validateSearchParameters(searchParams);
        
        // Update input validation states
        setInputValidation({
            location: { 
                isValid: !validation.errors.location, 
                message: validation.errors.location || "" 
            },
            keywords: { 
                isValid: !validation.errors.keywords, 
                message: validation.errors.keywords || "" 
            }
        });

        // Set errors for display
        const newErrors = {
            location: validation.errors.location || "",
            type: validation.errors.propertyType || "",
            query: validation.errors.keywords || ""
        };

        setErrors(newErrors);

        if (!validation.isValid) {
            // Focus first invalid field
            if (newErrors.location) {
                const input = searchWrapperRef.current?.querySelector('input[name="locationInput"]');
                input?.focus();
            } else if (newErrors.query) {
                const input = searchWrapperRef.current?.querySelector('input[name="keywordInput"]');
                input?.focus();
            }
            return;
        }

        // Convert to API payload format
        const payload = convertToApiPayload(validation.normalized);

        // Add to search history
        dispatch(addToSearchHistory({
            query: payload.query,
            location: payload.location,
            resultsCount: 0 // Will be updated when results come back
        }));

        // Update current query in Redux
        dispatch(setCurrentQuery({
            query: payload.query,
            location: payload.location
        }));

        // All fields valid — call parent onSearch with POST-ready payload
        if (onSearch) onSearch(payload);
        setOpenDropdown(null);
        setShowSuggestions(false);
        setShowRecentSearches(false);
    };

    // Clear search inputs
    const handleClearSearch = () => {
        setLocationInput("");
        setKeywordInput("");
        setErrors({ location: "", type: "", query: "" });
        setInputValidation({
            location: { isValid: true, message: "" },
            keywords: { isValid: true, message: "" }
        });
        setShowSuggestions(false);
        setShowRecentSearches(false);
        dispatch(clearSuggestions());
    };

    return (
        <section className="relative w-full min-h-[280px] flex flex-col items-center justify-center text-white overflow-hidden py-8">

            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1600596542815-600025513036?q=80&w=2000&auto=format&fit=crop"
                    alt="Real Estate Background"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/70 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative w-full max-w-5xl px-4 md:px-6 space-y-8 z-10">

                {/* Main Search Component */}
                <div ref={searchWrapperRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-2 md:p-3 max-w-4xl mx-auto text-slate-800 dark:text-slate-100">

                    {/* Tabs (Rent/Buy/Commercial) */}
                    <div className="flex gap-2 mb-3 px-2 overflow-x-auto scrollbar-hide">
                        {['rent', 'buy'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize whitespace-nowrap
                                   ${activeTab === tab
                                        ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'
                                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 relative">

                        {/* 1. Location Input (Spans 5 columns) */}
                        <div className="md:col-span-5 relative group">
                            <div className={`
                                flex items-center px-4 h-14 bg-slate-50 dark:bg-slate-700 rounded-xl border-2 transition-all
                               ${(showSuggestions || showRecentSearches) ? 'border-indigo-500 rounded-b-none' : 
                                 !inputValidation.location.isValid ? 'border-red-500' : 
                                 'border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-600'}
                            `}>
                                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-[-2px]">
                                        Location
                                    </label>
                                    <input
                                        name="locationInput"
                                        type="text"
                                        value={locationInput}
                                        onChange={handleLocationInput}
                                        onFocus={handleLocationFocus}
                                        placeholder="City, Locality (e.g., New York, NY)"
                                        className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 truncate outline-none"
                                    />
                                </div>

                                {/* Clear button */}
                                {locationInput && (
                                    <button
                                        onClick={() => {
                                            setLocationInput("");
                                            setShowSuggestions(false);
                                            setShowRecentSearches(true);
                                        }}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-400 transition-colors mr-1"
                                        title="Clear location"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Use Location Button */}
                                <button
                                    onClick={handleUseMyLocation}
                                    disabled={isLocating}
                                    title="Use my current location"
                                    className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400 transition-colors"
                                >
                                    {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Enhanced Autocomplete Dropdown */}
                            {(showSuggestions || showRecentSearches) && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-t-0 border-indigo-100 dark:border-slate-700 rounded-b-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                                    
                                    {/* Recent Searches Section */}
                                    {showRecentSearches && searchHistory.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Recent Searches</span>
                                                </div>
                                            </div>
                                            {searchHistory.slice(0, 5).map((search, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSelectSuggestion(search.location, 'recent')}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                                >
                                                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{search.location}</div>
                                                        {search.query && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">"{search.query}"</div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search Suggestions Section */}
                                    {showSuggestions && (
                                        <div>
                                            {(searchSuggestions.length > 0 || suggestions.length > 0) && (
                                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Suggestions</span>
                                                </div>
                                            )}
                                            
                                            {/* API Suggestions */}
                                            {searchSuggestions.length > 0 ? (
                                                searchSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={`api-${index}`}
                                                        onClick={() => handleSelectSuggestion(suggestion)}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                                    >
                                                        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                        {suggestion}
                                                    </button>
                                                ))
                                            ) : (
                                                /* Fallback to Mock Suggestions */
                                                suggestions.length > 0 ? (
                                                    suggestions.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleSelectSuggestion(item.text)}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                                        >
                                                            {item.type === 'location' ? <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                                                            {item.text}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-sm text-slate-400 dark:text-slate-500 text-center">
                                                        {isSuggestionsLoading ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Loading suggestions...
                                                            </div>
                                                        ) : (
                                                            "No suggestions found"
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Empty state for recent searches */}
                                    {showRecentSearches && searchHistory.length === 0 && (
                                        <div className="p-4 text-sm text-slate-400 dark:text-slate-500 text-center">
                                            No recent searches
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Validation message */}
                            {(!inputValidation.location.isValid || errors.location) && (
                                <div className="flex items-center gap-1 mt-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-red-600 text-xs">{errors.location || inputValidation.location.message}</p>
                                </div>
                            )}
                        </div>

                        {/* 2. Property Type Select (Spans 3 columns) */}
                        <div className="md:col-span-3 relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                className={`
                                    w-full flex items-center px-4 h-14 bg-slate-50 dark:bg-slate-700 rounded-xl border-2 text-left transition-all
                                   ${openDropdown === 'type' ? 'border-indigo-500' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600'}
                                `}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-[-2px]">
                                        Property Type
                                    </label>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{propertyType}</div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform${openDropdown === 'type' ? ' rotate-180' : ''}`} />
                            </button>

                            {/* Type Dropdown Content */}
                            {openDropdown === 'type' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        key="all-types"
                                        onClick={() => { setPropertyType("All Types"); setOpenDropdown(null); setErrors(prev => ({ ...prev, type: "" })); }}
                                        className={`
                                            w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                                           ${propertyType === "All Types" ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                        `}
                                    >
                                        All Types
                                        {propertyType === "All Types" && <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                                    </button>
                                    {FILTER_PROPERTY_TYPE_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setPropertyType(option.value); setOpenDropdown(null); setErrors(prev => ({ ...prev, type: "" })); }}
                                            className={`
                                                w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                                               ${propertyType === option.value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                            `}
                                        >
                                            {option.label}
                                            {propertyType === option.value && <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* validation message */}
                            {errors.type && (
                                <p className="text-red-600 text-xs mt-2">{errors.type}</p>
                            )}
                        </div>

                        {/* 3. Keyword Input (REPLACES Budget) (Spans 3 columns) */}
                        <div className="md:col-span-3 relative">
                            <div className={`
                                w-full flex items-center px-4 h-14 bg-slate-50 dark:bg-slate-700 rounded-xl border-2 text-left transition-all
                               ${!inputValidation.keywords.isValid ? 'border-red-500' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600'}
                            `}>
                                <div className="flex-1 overflow-hidden">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-[-2px]">
                                        Keywords
                                    </label>
                                    <input
                                        name="keywordInput"
                                        type="text"
                                        value={keywordInput}
                                        onChange={handleKeywordInput}
                                        placeholder="3 BHK, furnished, parking..."
                                        className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 truncate outline-none"
                                    />
                                </div>
                                
                                {/* Clear button */}
                                {keywordInput && (
                                    <button
                                        onClick={() => {
                                            setKeywordInput("");
                                            setInputValidation(prev => ({
                                                ...prev,
                                                keywords: { isValid: true, message: "" }
                                            }));
                                        }}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-400 transition-colors"
                                        title="Clear keywords"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Validation message */}
                            {(!inputValidation.keywords.isValid || errors.query) && (
                                <div className="flex items-center gap-1 mt-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-red-600 text-xs">{errors.query || inputValidation.keywords.message}</p>
                                </div>
                            )}
                        </div>

                        {/* 4. Search Button (Spans 1 column on desktop) */}
                        <div className="md:col-span-1 flex gap-2">
                            <button
                                onClick={handleSearchSubmit}
                                disabled={!inputValidation.location.isValid || !inputValidation.keywords.isValid}
                                className="flex-1 h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center justify-center transition-colors"
                            >
                                <Search className="w-5 h-5" />
                                <span className="md:hidden ml-2 font-bold">Search</span>
                            </button>
                            
                            {/* Clear All Button (visible when there's input) */}
                            {(locationInput || keywordInput) && (
                                <button
                                    onClick={handleClearSearch}
                                    className="h-14 px-3 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                                    title="Clear all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
