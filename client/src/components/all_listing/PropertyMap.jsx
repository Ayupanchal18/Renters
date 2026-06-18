import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Bath, Bed, X, ArrowRight, Home } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom cluster icon using --rt-sys primary color ─────────────────────────
const createClusterCustomIcon = (cluster) => {
    const count = cluster.getChildCount();
    const size = count < 10 ? 36 : count < 100 ? 42 : 50;
    return L.divIcon({
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${count < 10 ? '13px' : '11px'};
                font-weight: 800;
                font-family: inherit;
                box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 0 4px hsl(var(--primary) / 0.2);
                cursor: pointer;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
                line-height: 1;
            ">
                ${count}
            </div>
        `,
        className: 'custom-cluster-icon',
        iconSize: L.point(size, size, true),
        iconAnchor: [size / 2, size / 2],
    });
};

// ─── Individual marker icons ──────────────────────────────────────────────────
const createCustomIcon = (isSelected = false, isHovered = false) => {
    const size = isSelected ? 40 : isHovered ? 34 : 28;
    const bg = isSelected
        ? 'hsl(var(--secondary, 15 100% 60%))'   // amber/coral for active
        : 'hsl(var(--primary))';
    const shadow = isSelected
        ? '0 6px 18px rgba(0,0,0,0.5)'
        : isHovered
            ? '0 4px 14px rgba(0,0,0,0.4)'
            : '0 3px 10px rgba(0,0,0,0.25)';
    const iconSize = isSelected ? '16px' : '11px';

    return L.divIcon({
        className: '',
        html: `
            <div class="marker-pin-wrapper" style="
                width: ${size}px;
                height: ${size}px;
                background: ${bg};
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg) ${isHovered && !isSelected ? 'scale(1.1)' : ''};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: ${shadow};
                transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <svg style="transform: rotate(45deg); width: ${iconSize}; height: ${iconSize}; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
    });
};

// ─── FitBoundsToMarkers ───────────────────────────────────────────────────────
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

// ─── FlyToMarker ─────────────────────────────────────────────────────────────
const FlyToMarker = ({ property, zoom = 15 }) => {
    const map = useMap();

    useEffect(() => {
        if (property) {
            const lat = property.location.coordinates[1];
            const lng = property.location.coordinates[0];
            map.flyTo([lat, lng], zoom, { duration: 0.5, easeLinearity: 0.5 });
        }
    }, [map, property, zoom]);

    return null;
};

// ─── Property Detail Card Overlay ─────────────────────────────────────────────
const PropertyDetailCard = ({ property, onClose, onViewDetails }) => {
    if (!property) return null;

    const price = property.monthlyRent
        ? `₹${property.monthlyRent?.toLocaleString()}/mo`
        : property.sellingPrice
            ? `₹${property.sellingPrice >= 10000000
                ? (property.sellingPrice / 10000000).toFixed(2) + ' Cr'
                : (property.sellingPrice / 100000).toFixed(2) + ' L'}`
            : '—';

    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[290px] animate-slide-up">
            <div className="bg-card rounded-xl shadow-2xl border border-border/80 overflow-hidden backdrop-blur-xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-1">{property.title}</h3>
                        <p className="text-white/95 text-[10px] flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate">{property.address || property.city}</span>
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="p-3">
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
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Price</p>
                            <p className="text-primary font-bold text-sm sm:text-base">{price}</p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => onViewDetails(property.slug)}
                            className="gap-1 h-8 text-xs px-2.5"
                        >
                            View
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main PropertyMap Component ──────────────────────────────────────────────
export function PropertyMap({
    listings = [],
    properties = [],
    loading = false,
    activeListingId = null,
    hoveredListingId = null,
    onMarkerClick,
    onMarkerHover,
    className = "",
}) {
    const allProperties = listings.length > 0 ? listings : properties;
    const navigate = useNavigate();
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [flyToProperty, setFlyToProperty] = useState(null);
    const mapRef = useRef(null);
    const hoverTimer = useRef(null);

    // Filter properties with valid coordinates
    const propertiesWithCoords = allProperties.filter(p =>
        p.location?.coordinates?.[0] &&
        p.location?.coordinates?.[1] &&
        p.location.coordinates[0] !== 0 &&
        p.location.coordinates[1] !== 0
    );

    // Find selected property details
    const selectedPropertyObj = propertiesWithCoords.find(p => p._id === selectedPropertyId);

    // Center map around first coordinate or standard India coordinate
    const defaultCenter = [20.5937, 78.9629];
    const center = propertiesWithCoords.length > 0
        ? [
            propertiesWithCoords[0].location.coordinates[1],
            propertiesWithCoords[0].location.coordinates[0]
          ]
        : defaultCenter;

    // Sync activeListingId changes (e.g. from hovering/clicking card)
    useEffect(() => {
        if (activeListingId) {
            const prop = propertiesWithCoords.find(p => p._id === activeListingId);
            if (prop) {
                setSelectedPropertyId(activeListingId);
                setFlyToProperty(prop);
            }
        } else {
            setSelectedPropertyId(null);
            setFlyToProperty(null);
        }
    }, [activeListingId, allProperties]);

    const handleViewDetails = useCallback((slug) => {
        const prop = allProperties.find(p => p.slug === slug);
        if (prop) {
            const route = prop.listingType === 'buy' ? `/buy/${slug}` : `/rent/${slug}`;
            navigate(route);
        } else {
            navigate(`/properties/${slug}`);
        }
    }, [navigate, allProperties]);

    const handleMarkerClick = useCallback((property) => {
        setSelectedPropertyId(property._id);
        setFlyToProperty(property);
        onMarkerClick?.(property._id);
    }, [onMarkerClick]);

    const handleMarkerMouseOver = useCallback((propertyId) => {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => {
            onMarkerHover?.(propertyId);
        }, 75);
    }, [onMarkerHover]);

    const handleMarkerMouseOut = useCallback(() => {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => {
            onMarkerHover?.(null);
        }, 75);
    }, [onMarkerHover]);

    const handleCloseCard = useCallback(() => {
        setSelectedPropertyId(null);
        setFlyToProperty(null);
        onMarkerClick?.(null);
    }, [onMarkerClick]);

    useEffect(() => {
        return () => clearTimeout(hoverTimer.current);
    }, []);

    // ─── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={`w-full h-full min-h-[350px] bg-muted animate-pulse rounded-2xl flex items-center justify-center border border-border ${className}`}>
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Loading map view...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative w-full h-full rounded-2xl border border-border overflow-hidden bg-muted shadow-md ${className}`}
            aria-label={`Map view showing ${propertiesWithCoords.length} properties.`}
        >
            {propertiesWithCoords.length > 0 ? (
                <div className="w-full h-full">
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

                        {/* Cluster Markers */}
                        <MarkerClusterGroup
                            chunkedLoading
                            iconCreateFunction={createClusterCustomIcon}
                            showCoverageOnHover={false}
                            maxClusterRadius={60}
                            spiderfyOnMaxZoom={true}
                            zoomToBoundsOnClick={true}
                        >
                            {propertiesWithCoords.map((property) => {
                                const isActive = activeListingId === property._id || selectedPropertyId === property._id;
                                const isHovered = hoveredListingId === property._id;
                                return (
                                    <Marker
                                        key={property._id}
                                        position={[
                                            property.location.coordinates[1],
                                            property.location.coordinates[0]
                                        ]}
                                        icon={createCustomIcon(isActive, isHovered)}
                                        eventHandlers={{
                                            click: () => handleMarkerClick(property),
                                            mouseover: () => handleMarkerMouseOver(property._id),
                                            mouseout: handleMarkerMouseOut,
                                        }}
                                    />
                                );
                            })}
                        </MarkerClusterGroup>

                        {/* Adjust bounds on load if not flying to marker */}
                        {!flyToProperty && <FitBoundsToMarkers properties={propertiesWithCoords} />}

                        {/* Fly to specific marker */}
                        {flyToProperty && <FlyToMarker property={flyToProperty} zoom={14} />}
                    </MapContainer>

                    {/* Visually Hidden SR Text */}
                    <div className="sr-only">
                        Map view — {propertiesWithCoords.length} properties.
                        Use the list above to browse properties; the map provides a visual reference only.
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="text-center p-6 bg-card rounded-2xl shadow-xl border border-border max-w-xs mx-4">
                        <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-1 text-sm">No locations available</h3>
                        <p className="text-xs text-muted-foreground">
                            Properties in this search don't have valid coordinates.
                            Try a different search or filter.
                        </p>
                    </div>
                </div>
            )}

            {/* Property Detail Card Overlay */}
            {selectedPropertyObj && (
                <PropertyDetailCard
                    property={selectedPropertyObj}
                    onClose={handleCloseCard}
                    onViewDetails={handleViewDetails}
                />
            )}

            {/* Map count badge */}
            {propertiesWithCoords.length > 0 && (
                <div className="absolute bottom-4 left-4 z-[500]">
                    <div className="bg-card/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg border border-border">
                        <p className="text-xs font-semibold text-foreground">
                            <span className="text-primary font-bold">{propertiesWithCoords.length}</span> properties on map
                        </p>
                    </div>
                </div>
            )}

            {/* Show all bounds button */}
            {flyToProperty && propertiesWithCoords.length > 0 && (
                <div className="absolute top-4 left-14 z-[500]">
                    <button
                        onClick={handleCloseCard}
                        className="bg-card/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md border border-border text-xs font-medium text-foreground hover:bg-card hover:text-primary transition-colors"
                    >
                        Show all
                    </button>
                </div>
            )}
        </div>
    );
}

export default PropertyMap;
