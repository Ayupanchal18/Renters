import { useEffect, useState, useCallback } from "react";
import { MapPin, Home, Bed, Bath, IndianRupee, ExternalLink, Navigation, Loader2, Map as MapIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";

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
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-sm line-clamp-1">{property.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {property.address || property.city}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {property.bedrooms && <span><Bed className="w-3 h-3 inline" /> {property.bedrooms}</span>}
                    {property.bathrooms && <span><Bath className="w-3 h-3 inline" /> {property.bathrooms}</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-bold text-sm">
                        ₹{property.monthlyRent?.toLocaleString()}/mo
                    </span>
                    <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-6 text-xs px-2"
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

// Main Map View Component - Using iframe for OpenStreetMap to avoid React-Leaflet issues
export function PropertyMapView({ properties = [], loading = false }) {
    const navigate = useNavigate();
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    
    // Filter properties with valid coordinates
    const propertiesWithCoords = properties.filter(p => 
        p.location?.coordinates?.[0] && 
        p.location?.coordinates?.[1] &&
        p.location.coordinates[0] !== 0 &&
        p.location.coordinates[1] !== 0
    );
    
    // Calculate center
    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center
    const center = propertiesWithCoords.length > 0
        ? {
            lat: propertiesWithCoords[0].location.coordinates[1],
            lng: propertiesWithCoords[0].location.coordinates[0]
          }
        : defaultCenter;
    
    const handleViewDetails = useCallback((slug) => {
        navigate(`/properties/${slug}`);
    }, [navigate]);

    // Generate OpenStreetMap embed URL with markers
    const generateMapUrl = useCallback(() => {
        if (propertiesWithCoords.length === 0) {
            return `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 2},${center.lat - 2},${center.lng + 2},${center.lat + 2}&layer=mapnik`;
        }
        
        // Calculate bounding box
        const lats = propertiesWithCoords.map(p => p.location.coordinates[1]);
        const lngs = propertiesWithCoords.map(p => p.location.coordinates[0]);
        const minLat = Math.min(...lats) - 0.05;
        const maxLat = Math.max(...lats) + 0.05;
        const minLng = Math.min(...lngs) - 0.05;
        const maxLng = Math.max(...lngs) + 0.05;
        
        // If only one property, add some padding
        const bbox = propertiesWithCoords.length === 1
            ? `${center.lng - 0.02},${center.lat - 0.02},${center.lng + 0.02},${center.lat + 0.02}`
            : `${minLng},${minLat},${maxLng},${maxLat}`;
        
        // Add marker for selected or first property
        const markerProperty = selectedProperty 
            ? propertiesWithCoords.find(p => p._id === selectedProperty)
            : propertiesWithCoords[0];
        
        if (markerProperty) {
            const markerLat = markerProperty.location.coordinates[1];
            const markerLng = markerProperty.location.coordinates[0];
            return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerLat},${markerLng}`;
        }
        
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
    }, [propertiesWithCoords, selectedProperty, center]);

    if (loading) {
        return (
            <div className="w-full h-[500px] md:h-[600px] bg-muted rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-300px)] lg:min-h-[500px] lg:max-h-[700px]">
            {/* Map Section */}
            <div className="relative flex-1 min-h-[250px] h-[300px] lg:h-auto rounded-2xl overflow-hidden border border-border shadow-lg bg-muted">
                {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Loading map...</p>
                        </div>
                    </div>
                )}
                
                <iframe
                    title="Property Map"
                    src={generateMapUrl()}
                    className="w-full h-full border-0"
                    onLoad={() => setMapLoaded(true)}
                    loading="lazy"
                />
                
                {/* Map Overlay Info */}
                <div className="absolute bottom-4 left-4 z-20">
                    <div className="bg-card/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-border">
                        <p className="text-sm font-medium text-foreground">
                            <span className="text-primary">{propertiesWithCoords.length}</span>
                            {" "}properties with location
                        </p>
                    </div>
                </div>
                
                {/* Open in OSM button */}
                <div className="absolute top-4 right-4 z-20">
                    <a
                        href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=12/${center.lat}/${center.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-card/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-border text-sm font-medium text-foreground hover:bg-card transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open in Maps
                    </a>
                </div>
                
                {/* No Properties Message */}
                {propertiesWithCoords.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                        <div className="text-center p-6 bg-card rounded-2xl shadow-xl border border-border max-w-sm">
                            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-semibold text-foreground mb-2">No locations available</h3>
                            <p className="text-sm text-muted-foreground">
                                Properties in this search don't have location coordinates. 
                                Try a different search or view in grid/list mode.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Properties List Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-[300px] sm:h-[350px] lg:h-auto lg:max-h-full">
                <div className="p-4 border-b border-border bg-muted/50 flex-shrink-0">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Home className="w-4 h-4 text-primary" />
                        Properties ({propertiesWithCoords.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Click a property to highlight on map
                    </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {propertiesWithCoords.length > 0 ? (
                        propertiesWithCoords.map((property) => (
                            <PropertyListItem
                                key={property._id}
                                property={property}
                                isSelected={selectedProperty === property._id}
                                onClick={() => setSelectedProperty(property._id)}
                                onViewDetails={handleViewDetails}
                            />
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
