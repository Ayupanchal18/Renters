import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { INDIAN_STATES } from "@shared/propertyTypes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "../../../utils/locationStandardization";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // Center of India

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] !== 0 && center[1] !== 0) {
            map.setView(center, 15, { animate: true });
        }
    }, [map, center]);
    return null;
}

export default function LocationStep({ formData, setFormData, validationErrors }) {
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [reverseLocality, setReverseLocality] = useState("");
    const [reverseLoading, setReverseLoading] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Load cities list
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch("/api/locations/cities");
                const data = await response.json();
                if (data.success && data.data.length > 0) {
                    setCities(data.data.map(c => c.name));
                } else {
                    setCities(["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"]);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
                setCities(["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"]);
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, []);

    // Set map center if formData has mapLocation coordinate
    useEffect(() => {
        if (formData.mapLocation) {
            const coords = formData.mapLocation.split(",");
            if (coords.length === 2) {
                const lat = parseFloat(coords[0]);
                const lng = parseFloat(coords[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    setMapCenter([lat, lng]);
                }
            }
        }
    }, [formData.mapLocation]);

    // Nominatim geocoding address autocomplete suggest handler
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!value.trim() || value.length < 3) {
            setSuggestions([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=in&addressdetails=1`;
                const response = await fetch(url, {
                    headers: {
                        "User-Agent": "RentersListingWizard/1.0"
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Geocoding failed:", err);
            } finally {
                setSearching(false);
            }
        }, 600);
    };

    // Apply suggestions selection
    const handleSelectSuggestion = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        
        if (isNaN(lat) || isNaN(lng)) return;

        const updatedCoords = `${lat}, ${lng}`;
        
        // Extract address details if available
        const addr = place.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || "";
        const state = addr.state || "";
        const pincode = addr.postcode || "";
        const locality = addr.neighbourhood || addr.residential || addr.suburb || "";

        setFormData(prev => ({
            ...prev,
            mapLocation: updatedCoords,
            city: cities.includes(city) ? city : prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode,
            locality: locality || prev.locality || place.display_name.split(",")[0],
            address: place.display_name
        }));

        setMapCenter([lat, lng]);
        setSuggestions([]);
        setSearchQuery("");
        setReverseLocality(place.display_name);
    };

    // Reverse geocode when dragging pin marker
    const handleMarkerDragEnd = async (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const lat = position.lat;
        const lng = position.lng;
        const updatedCoords = `${lat}, ${lng}`;

        setFormData(prev => ({
            ...prev,
            mapLocation: updatedCoords
        }));
        setMapCenter([lat, lng]);

        setReverseLoading(true);
        try {
            const result = await reverseGeocode(lat, lng, "nominatim");
            if (result && result.formatted) {
                setReverseLocality(result.formatted);
                // Pre-fill locality if empty
                if (!formData.locality && result.city) {
                    setFormData(prev => ({ ...prev, locality: result.city }));
                }
            } else {
                setReverseLocality(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
            }
        } catch (err) {
            console.error("Reverse geocoding error:", err);
            setReverseLocality(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        } finally {
            setReverseLoading(false);
        }
    };

    // Geolocation support trigger
    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const updatedCoords = `${lat}, ${lng}`;

                    setFormData(prev => ({
                        ...prev,
                        mapLocation: updatedCoords
                    }));
                    setMapCenter([lat, lng]);

                    setReverseLoading(true);
                    try {
                        const result = await reverseGeocode(lat, lng, "nominatim");
                        if (result) {
                            setFormData(prev => ({
                                ...prev,
                                city: cities.includes(result.city) ? result.city : prev.city,
                                state: result.state || prev.state,
                                locality: result.city || prev.locality || "",
                            }));
                            setReverseLocality(result.formatted);
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setReverseLoading(false);
                    }
                },
                () => {
                    alert("Unable to retrieve your location. Please pin it manually.");
                }
            );
        }
    };

    const isCoordsValid = mapCenter[0] !== DEFAULT_CENTER[0] || formData.mapLocation;

    return (
        <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <MapPin size={22} className="text-primary" />
                Property Location
            </h2>

            {/* Address Search Autosuggest Input */}
            <div className="space-y-2 relative">
                <Label htmlFor="address-search" className="text-foreground font-semibold text-xs sm:text-sm">
                    Search Location / Building *
                </Label>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="address-search"
                        placeholder="Search for landmarks, locality, complex names..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 h-10 rounded-xl text-xs sm:text-sm"
                    />
                    {searching && (
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* Suggestions List Overlay */}
                {suggestions.length > 0 && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setSuggestions([])} />
                        <ul className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-border/60">
                            {suggestions.map((place, idx) => (
                                <li key={idx}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectSuggestion(place)}
                                        className="w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-muted text-foreground transition-colors truncate"
                                    >
                                        {place.display_name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City Selection */}
                <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground font-semibold text-xs sm:text-sm">City *</Label>
                    <select
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={loadingCities}
                        className={`w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                            validationErrors.city ? "border-destructive" : "border-input"
                        }`}
                    >
                        <option value="">{loadingCities ? "Loading cities..." : "Select city"}</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                    {validationErrors.city && (
                        <p className="text-destructive text-[10px]">{validationErrors.city}</p>
                    )}
                </div>

                {/* State Selection */}
                <div className="space-y-2">
                    <Label htmlFor="state" className="text-foreground font-semibold text-xs sm:text-sm">State</Label>
                    <select
                        id="state"
                        value={formData.state || ""}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3.5 py-2 h-10 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                    >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Locality */}
                <div className="space-y-2">
                    <Label htmlFor="locality" className="text-foreground font-semibold text-xs sm:text-sm">Locality / Society *</Label>
                    <Input
                        id="locality"
                        placeholder="e.g., Green Valley Society, Sector 12"
                        value={formData.locality || ""}
                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                        className="h-10 rounded-xl text-xs sm:text-sm"
                    />
                </div>

                {/* Pincode */}
                <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-foreground font-semibold text-xs sm:text-sm">Pin Code</Label>
                    <Input
                        id="pincode"
                        placeholder="e.g., 560034"
                        value={formData.pincode || ""}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        inputMode="numeric"
                        maxLength={6}
                        className={`h-10 rounded-xl text-xs sm:text-sm ${validationErrors.pincode ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {validationErrors.pincode && (
                        <p className="text-destructive text-[10px]">{validationErrors.pincode}</p>
                    )}
                </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground font-semibold text-xs sm:text-sm">Full Address *</Label>
                <textarea
                    id="address"
                    placeholder="Enter complete building number, street details, wings, and landmarks..."
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className={`w-full px-3.5 py-2.5 border rounded-xl bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none ${
                        validationErrors.address ? "border-destructive" : "border-input"
                    }`}
                />
                {validationErrors.address && (
                    <p className="text-destructive text-[10px]">{validationErrors.address}</p>
                )}
            </div>

            {/* Interactive Leaflet Picker Map */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-foreground font-semibold text-xs sm:text-sm">Confirm Location Pin on Map *</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUseCurrentLocation}
                        className="text-xs flex items-center gap-1 hover:bg-muted text-primary rounded-lg"
                    >
                        <Navigation size={13} />
                        Use My GPS
                    </Button>
                </div>

                <div className="h-64 sm:h-72 rounded-xl border border-border overflow-hidden relative z-10 shadow-inner">
                    <MapContainer
                        center={isCoordsValid ? mapCenter : DEFAULT_CENTER}
                        zoom={isCoordsValid ? 16 : 4}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                            draggable={true}
                            position={isCoordsValid ? mapCenter : DEFAULT_CENTER}
                            eventHandlers={{
                                dragend: handleMarkerDragEnd
                            }}
                        />
                        <MapController center={isCoordsValid ? mapCenter : null} />
                    </MapContainer>
                </div>

                {/* reverse geocoded display */}
                {isCoordsValid && (
                    <div className="p-3 bg-muted/40 border border-border/80 rounded-xl flex items-center gap-2 text-[10px] sm:text-xs text-foreground font-medium">
                        {reverseLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                        ) : (
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <span className="truncate">
                            {reverseLoading
                                ? "Reverse geocoding coordinates..."
                                : reverseLocality || `Coordinates pinned at: ${formData.mapLocation}`}
                        </span>
                    </div>
                )}

                {validationErrors.mapLocation && (
                    <p className="text-destructive text-xs font-semibold">{validationErrors.mapLocation}</p>
                )}
            </div>
        </div>
    );
}
