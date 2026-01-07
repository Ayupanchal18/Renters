import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Home, Bed, Bath, ExternalLink, Loader2, Map as MapIcon, X, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (isSelected = false) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: ${isSelected ? '36px' : '28px'};
                height: ${isSelected ? '36px' : '28px'};
                background: ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--primary))'};
                border: 3px solid ${isSelected ? 'white' : 'rgba(255,255,255,0.8)'};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,${isSelected ? '0.5' : '0.3'});
                transition: all 0.2s ease;
            ">
                <svg style="transform: rotate(45deg); width: ${isSelected ? '16px' : '12px'}; height: ${isSelected ? '16px' : '12px'}; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 36 : 28],
    });
};

// Component to fit bounds to all markers
const FitBoundsToMarkers = ({ properties }) => {
    const map = useMap();
    
    useEffect(() => {
        if (properties.length === 0) return;
        
        const bounds = L.latLngBounds(
            properties.map(p => [
                p.location.coordinates[1],
                p.location.coordinates[0]
            ])
        );
        
        map.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 12 
        });
    }, [map, properties]);
    
    return null;
};

// Component to handle flying to a marker when selected
const FlyToMarker = ({ property, zoom = 15 }) => {
    const map = useMap();
    
    useEffect(() => {
        if (property) {
            const lat = property.location.coordinates[1];
            const lng = property.location.coordinates[0];
            map.flyTo([lat, lng], zoom, { duration: 0.6 });
        }
    }, [map, property, zoom]);
    
    return null;
};

// Property Card for the sidebar list
const PropertyListItem = ({ property, isSelected, onClick, onViewDetails }) => {
    const imageUrl = property.photos?.[0] 
        ? property.photos[0] 
        : "/placeholder.svg";
    
    return (
        <div 
            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                isSelected 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-card border border-border hover:border-primary/50'
            }`}
            onClick={onClick}
        >
            <img 
                src={imageUrl} 
                alt={property.title}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-xs sm:text-sm line-clamp-1">{property.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {property.address || property.city}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {property.bedrooms && <span><Bed className="w-3 h-3 inline" /> {property.bedrooms}</span>}
                    {property.bathrooms && <span><Bath className="w-3 h-3 inline" /> {property.bathrooms}</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-bold text-xs sm:text-sm">
                        ₹{property.monthlyRent?.toLocaleString()}/mo
                    </span>
                    <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-6 text-xs px-2 hidden sm:flex"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(property.slug);
                        }}
                    >
                        View <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Property Detail Card Overlay (replaces popup)
const PropertyDetailCard = ({ property, onClose, onViewDetails }) => {
    if (!property) return null;
    
    return (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[1000] w-[85%] max-w-[280px] animate-slide-up">
            <div className="bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-1.5 right-1.5 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                
                {/* Image */}
                <div className="relative h-24">
                    <img 
                        src={property.photos?.[0] || '/placeholder.svg'} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="font-semibold text-white text-sm line-clamp-1">{property.title}</h3>
                        <p className="text-white/80 text-[11px] flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate">{property.address || property.city}</span>
                        </p>
                    </div>
                </div>
                
                {/* Details */}
                <div className="p-2.5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        {property.bathrooms && (
                            <span className="flex items-center gap-1">
                                <Bath className="w-3 h-3 text-primary" /> 
                                {property.bathrooms} Bath
                            </span>
                        )}
                        {property.bedrooms && (
                            <span className="flex items-center gap-1">
                                <Bed className="w-3 h-3 text-primary" /> 
                                {property.bedrooms} Bed
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">Monthly Rent</p>
                            <p className="text-primary font-bold text-base">
                                ₹{property.monthlyRent?.toLocaleString()}
                            </p>
                        </div>
                        <Button 
                            size="sm"
                            onClick={() => onViewDetails(property.slug)}
                            className="gap-1 h-8 text-xs px-3"
                        >
                            View Details
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Map View Component with all markers
export function PropertyMapView({ properties = [], loading = false }) {
    const navigate = useNavigate();
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [flyToProperty, setFlyToProperty] = useState(null);
    const mapRef = useRef(null);
    
    // Filter properties with valid coordinates
    const propertiesWithCoords = properties.filter(p => 
        p.location?.coordinates?.[0] && 
        p.location?.coordinates?.[1] &&
        p.location.coordinates[0] !== 0 &&
        p.location.coordinates[1] !== 0
    );
    
    // Find the selected property object
    const selectedPropertyObj = propertiesWithCoords.find(p => p._id === selectedProperty);
    
    // Calculate center
    const defaultCenter = [20.5937, 78.9629]; // India center
    const center = propertiesWithCoords.length > 0
        ? [
            propertiesWithCoords[0].location.coordinates[1],
            propertiesWithCoords[0].location.coordinates[0]
          ]
        : defaultCenter;
    
    const handleViewDetails = useCallback((slug) => {
        navigate(`/properties/${slug}`);
    }, [navigate]);

    const handleMarkerClick = useCallback((property) => {
        setSelectedProperty(property._id);
        setFlyToProperty(property);
        // Scroll the sidebar to show the selected property
        const element = document.getElementById(`property-item-${property._id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    const handleSidebarClick = useCallback((property) => {
        setSelectedProperty(property._id);
        setFlyToProperty(property);
    }, []);

    const handleCloseCard = useCallback(() => {
        setSelectedProperty(null);
        setFlyToProperty(null);
    }, []);

    if (loading) {
        return (
            <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] bg-muted rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {/* Map Section - Full width on mobile, flex-1 on desktop */}
            <div className="relative w-full lg:flex-1 h-[350px] sm:h-[400px] md:h-[500px] lg:h-[calc(100vh-280px)] lg:min-h-[450px] lg:max-h-[650px] rounded-2xl border border-border shadow-lg bg-muted">
                {propertiesWithCoords.length > 0 ? (
                    <div className="w-full h-full rounded-2xl overflow-hidden">
                        <MapContainer
                            ref={mapRef}
                            center={center}
                            zoom={10}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                            {/* Render ALL markers */}
                            {propertiesWithCoords.map((property) => (
                                <Marker
                                    key={property._id}
                                    position={[
                                        property.location.coordinates[1],
                                        property.location.coordinates[0]
                                    ]}
                                    icon={createCustomIcon(selectedProperty === property._id)}
                                    eventHandlers={{
                                        click: () => handleMarkerClick(property)
                                    }}
                                />
                            ))}
                            
                            {/* Auto-fit bounds to show all markers on initial load */}
                            {!flyToProperty && <FitBoundsToMarkers properties={propertiesWithCoords} />}
                            
                            {/* Fly to selected marker */}
                            {flyToProperty && <FlyToMarker property={flyToProperty} zoom={15} />}
                        </MapContainer>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
                        <div className="text-center p-6 bg-card rounded-2xl shadow-xl border border-border max-w-sm mx-4">
                            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-semibold text-foreground mb-2">No locations available</h3>
                            <p className="text-sm text-muted-foreground">
                                Properties in this search don't have location coordinates. 
                                Try a different search or view in grid/list mode.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Property Detail Card Overlay - Replaces Leaflet popup */}
                {selectedPropertyObj && (
                    <PropertyDetailCard 
                        property={selectedPropertyObj}
                        onClose={handleCloseCard}
                        onViewDetails={handleViewDetails}
                    />
                )}
                
                {/* Map Overlay Info */}
                {propertiesWithCoords.length > 0 && (
                    <div className="absolute bottom-4 left-4 z-[500]">
                        <div className="bg-card/95 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg border border-border">
                            <p className="text-xs sm:text-sm font-medium text-foreground">
                                <span className="text-primary">{propertiesWithCoords.length}</span>
                                {" "}properties on map
                            </p>
                        </div>
                    </div>
                )}

                {/* Show all button */}
                {flyToProperty && propertiesWithCoords.length > 0 && (
                    <div className="absolute top-4 left-14 z-[500]">
                        <button
                            onClick={handleCloseCard}
                            className="bg-card/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-border text-xs font-medium text-foreground hover:bg-card transition-colors"
                        >
                            Show all
                        </button>
                    </div>
                )}
            </div>
            
            {/* Properties List Sidebar - Hidden on mobile, shown on lg and above */}
            <div className="hidden lg:flex w-full lg:w-72 xl:w-80 flex-shrink-0 bg-card rounded-2xl border border-border overflow-hidden flex-col h-[250px] sm:h-[300px] lg:h-[calc(100vh-280px)] lg:min-h-[450px] lg:max-h-[650px]">
                <div className="p-3 sm:p-4 border-b border-border bg-muted/50 flex-shrink-0">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                        <Home className="w-4 h-4 text-primary" />
                        Properties ({propertiesWithCoords.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        Click a property to zoom on map
                    </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
                    {propertiesWithCoords.length > 0 ? (
                        propertiesWithCoords.map((property) => (
                            <div key={property._id} id={`property-item-${property._id}`}>
                                <PropertyListItem
                                    property={property}
                                    isSelected={selectedProperty === property._id}
                                    onClick={() => handleSidebarClick(property)}
                                    onViewDetails={handleViewDetails}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <MapIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No properties with location data
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PropertyMapView;
