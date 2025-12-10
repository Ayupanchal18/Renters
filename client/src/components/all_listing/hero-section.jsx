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
import {
    Search,
    MapPin,
    Loader2,
    Crosshair,
    ChevronDown
} from "lucide-react";

// Mock data for autocomplete suggestions
const MOCK_SUGGESTIONS = [
    { id: 1, text: "New York, NY", type: "location" },
    { id: 2, text: "Los Angeles, CA", type: "location" },
    { id: 3, text: "Modern Apartment in Downtown", type: "keyword" },
    { id: 4, text: "3 BHK Family House", type: "keyword" },
    { id: 5, text: "Sunnyvale, CA", type: "location" },
    { id: 6, text: "Studio near University", type: "keyword" },
];

export function HeroSection({ onSearch }) {
    // --- State Management ---
    const [activeTab, setActiveTab] = useState("rent"); // rent, buy, commercial

    // Universal Search State (we treat this as Location)
    const [locationInput, setLocationInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const searchWrapperRef = useRef(null);

    // Filters State
    const [propertyType, setPropertyType] = useState("All Types");
    // REPLACED budget with keywordInput
    const [keywordInput, setKeywordInput] = useState("");

    // Dropdown Visibility States
    const [openDropdown, setOpenDropdown] = useState(null); // 'type' or null

    // Validation errors
    const [errors, setErrors] = useState({ location: "", type: "", query: "" });

    // --- Handlers ---

    // 1. Handle Location Input & Autocomplete
    const handleLocationInput = (e) => {
        const val = e.target.value;
        setLocationInput(val);

        // clear previous errors for location
        setErrors(prev => ({ ...prev, location: "" }));

        if (val.length > 1) {
            const filtered = MOCK_SUGGESTIONS.filter(item =>
                item.text.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (text) => {
        setLocationInput(text);
        setShowSuggestions(false);
        setErrors(prev => ({ ...prev, location: "" }));
    };

    // 2. Real Geolocation Logic (Reverse Geocoding)
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    const data = await response.json();

                    // Construct a readable location string
                    const city = data.city || data.locality || "";
                    const state = data.principalSubdivision || "";
                    const locationString = state ? `${city}, ${state}` : city;

                    setLocationInput(locationString);
                    setIsLocating(false);
                    setErrors(prev => ({ ...prev, location: "" }));
                } catch (error) {
                    console.error("Error fetching location:", error);
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                alert("Unable to retrieve your location.");
            }
        );
    };

    // 3. Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setOpenDropdown(null);
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 4. Final Search Trigger with validation
    const handleSearchSubmit = () => {
        // build payload using locationInput as location
        const payload = {
            location: (locationInput || "").toString().trim(),
            type: (propertyType || "").toString().trim(),
            query: (keywordInput || "").toString().trim()
        };

        const newErrors = { location: "", type: "", query: "" };

        if (!payload.location) newErrors.location = "Location is required";
        if (!payload.type || payload.type === "All Types") newErrors.type = "Property type is required";
        if (!payload.query) newErrors.query = "Search keywords are required";

        setErrors(newErrors);

        const hasError = newErrors.location || newErrors.type || newErrors.query;

        if (hasError) {
            // Do not proceed — show errors under each field
            // Optionally focus first invalid field
            if (newErrors.location) {
                // focus location input
                const input = searchWrapperRef.current?.querySelector('input[name="locationInput"]');
                input?.focus();
            }
            return;
        }

        // All fields valid — call parent onSearch with POST-ready payload
        if (onSearch) onSearch(payload);
        setOpenDropdown(null);
    };

    return (
        <section className="relative w-full min-h-[250px] flex flex-col items-center justify-center text-white overflow-hidden">

            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1600596542815-600025513036?q=80&w=2000&auto=format&fit=crop"
                    alt="Real Estate Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative w-full max-w-5xl px-4 md:px-6 space-y-8 z-50">

                {/* Main Search Component */}
                <div ref={searchWrapperRef} className="bg-white rounded-2xl shadow-2xl p-2 md:p-3 max-w-4xl mx-auto text-slate-800">

                    {/* Tabs (Rent/Buy/Commercial) */}
                    <div className="flex gap-2 mb-3 px-2 overflow-x-auto scrollbar-hide">
                        {['rent', 'buy', 'commercial'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize whitespace-nowrap
                                   ${activeTab === tab
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-100'}
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
                                flex items-center px-4 h-14 bg-slate-50 rounded-xl border-2 transition-all
                               ${showSuggestions ? 'border-indigo-500 rounded-b-none' : 'border-transparent group-hover:border-slate-200'}
                            `}>
                                <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-[-2px]">
                                        Location or Keyword
                                    </label>
                                    <input
                                        name="locationInput"
                                        type="text"
                                        value={locationInput}
                                        onChange={handleLocationInput}
                                        placeholder="City, Locality, or '3 BHK'"
                                        className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 focus:ring-0 placeholder:text-slate-400 truncate outline-none"
                                    />
                                </div>

                                {/* Use Location Button */}
                                <button
                                    onClick={handleUseMyLocation}
                                    disabled={isLocating}
                                    title="Use my current location"
                                    className="p-2 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors"
                                >
                                    {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-indigo-100 rounded-b-xl shadow-xl z-50 overflow-hidden">
                                    {suggestions.length > 0 ? (
                                        suggestions.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelectSuggestion(item.text)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                {item.type === 'location' ? <MapPin className="w-4 h-4 text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
                                                {item.text}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-sm text-slate-400 text-center">No suggestions found</div>
                                    )}
                                </div>
                            )}

                            {/* validation message */}
                            {errors.location && (
                                <p className="text-red-600 text-xs mt-2">{errors.location}</p>
                            )}
                        </div>

                        {/* 2. Property Type Select (Spans 3 columns) */}
                        <div className="md:col-span-3 relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                className={`
                                    w-full flex items-center px-4 h-14 bg-slate-50 rounded-xl border-2 text-left transition-all
                                   ${openDropdown === 'type' ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'}
                                `}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-[-2px]">
                                        Property Type
                                    </label>
                                    <div className="text-sm font-semibold text-slate-900 truncate">{propertyType}</div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform${openDropdown === 'type' ? ' rotate-180' : ''}`} />
                            </button>

                            {/* Type Dropdown Content */}
                            {openDropdown === 'type' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {["All Types", "Apartment", "House", "Villa", "Commercial", "PG / Co-living"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => { setPropertyType(type); setOpenDropdown(null); setErrors(prev => ({ ...prev, type: "" })); }}
                                            className={`
                                                w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                                               ${propertyType === type ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                                            `}
                                        >
                                            {type}
                                            {propertyType === type && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
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
                                w-full flex items-center px-4 h-14 bg-slate-50 rounded-xl border-2 text-left transition-all
                               ${false ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'}
                            `}>
                                <div className="flex-1 overflow-hidden">
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-[-2px]">
                                        Keywords
                                    </label>
                                    <input
                                        name="keywordInput"
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => { setKeywordInput(e.target.value); setErrors(prev => ({ ...prev, query: "" })); }}
                                        placeholder="Keywords, amenities, features..."
                                        className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 focus:ring-0 placeholder:text-slate-400 truncate outline-none"
                                    />
                                </div>
                            </div>

                            {/* validation message */}
                            {errors.query && (
                                <p className="text-red-600 text-xs mt-2">{errors.query}</p>
                            )}
                        </div>

                        {/* 4. Search Button (Spans 1 column on desktop) */}
                        <div className="md:col-span-1">
                            <button
                                onClick={handleSearchSubmit}
                                className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 flex items-center justify-center md:px-0 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                                <span className="md:hidden ml-2 font-bold">Search</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
