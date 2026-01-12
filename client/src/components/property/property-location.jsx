import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import CommuteCalculator from './commute-calculator';

export default function PropertyLocation({ property }) {
    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState(false);

    // Parse coordinates from multiple possible sources
    const parseCoordinates = () => {
        // Try mapLocation string first (format: "lat, lng")
        const mapLocation = property?.mapLocation;
        if (mapLocation && typeof mapLocation === 'string') {
            const parts = mapLocation.split(',').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const [lat, lng] = parts;
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return { lat, lng };
                }
            }
        }
        
        // Try GeoJSON location.coordinates [lng, lat]
        const coords = property?.location?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            const [lng, lat] = coords;
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return { lat, lng };
                }
            }
        }
        
        // Try latitude/longitude fields directly
        const lat = property?.latitude || property?.lat;
        const lng = property?.longitude || property?.lng || property?.lon;
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            }
        }
        
        return null;
    };

    const coords = parseCoordinates();
    const hasCoords = coords !== null;

    // Build address
    const addressParts = [
        property?.address,
        property?.locality,
        property?.city,
        property?.state,
        property?.pincode
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ') || 'Address not available';

    const mapUrl = hasCoords 
        ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`
        : null;

    const directionsUrl = hasCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
        : null;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Location
                </h2>

                {/* Address */}
                <div className="mb-5">
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="text-foreground font-medium">{fullAddress}</p>
                </div>

                {/* Landmark */}
                {property?.landmark && (
                    <div className="mb-5 flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <Navigation className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                            <p className="text-xs text-muted-foreground">Nearby Landmark</p>
                            <p className="text-sm font-medium text-foreground">{property.landmark}</p>
                        </div>
                    </div>
                )}

                {/* Map */}
                {hasCoords && (
                    <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                        {mapLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                            </div>
                        )}
                        {mapError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">Map unavailable</p>
                            </div>
                        ) : (
                            <iframe
                                src={mapUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Property location map"
                                onLoad={() => setMapLoading(false)}
                                onError={() => { setMapLoading(false); setMapError(true); }}
                                className={mapLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}
                            />
                        )}
                    </div>
                )}

                {/* Get Directions Button */}
                {directionsUrl && (
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium text-foreground transition-colors"
                    >
                        <Navigation className="w-4 h-4" />
                        Get Directions
                        <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                )}

                {/* Commute Calculator */}
                {hasCoords && (
                    <CommuteCalculator propertyCoords={coords} />
                )}

                {/* Location Details Grid */}
                {(property?.city || property?.state || property?.pincode || property?.locality) && (
                    <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 gap-4">
                        {property?.locality && (
                            <div>
                                <p className="text-xs text-muted-foreground">Locality</p>
                                <p className="text-sm font-medium text-foreground">{property.locality}</p>
                            </div>
                        )}
                        {property?.city && (
                            <div>
                                <p className="text-xs text-muted-foreground">City</p>
                                <p className="text-sm font-medium text-foreground">{property.city}</p>
                            </div>
                        )}
                        {property?.state && (
                            <div>
                                <p className="text-xs text-muted-foreground">State</p>
                                <p className="text-sm font-medium text-foreground">{property.state}</p>
                            </div>
                        )}
                        {property?.pincode && (
                            <div>
                                <p className="text-xs text-muted-foreground">Pincode</p>
                                <p className="text-sm font-medium text-foreground">{property.pincode}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
