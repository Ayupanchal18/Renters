import React, { useState, useEffect } from 'react';
import { 
    MapPin, Loader2, RefreshCw, AlertCircle,
    Landmark, ShoppingBag, Building2, Bike, 
    Stethoscope, UtensilsCrossed, CreditCard, 
    Cross, Dumbbell, GraduationCap, Train
} from 'lucide-react';
import nearbyService from '../../api/nearbyService';

const ICON_MAP = {
    'Landmark': Landmark,
    'Building2': Building2,
    'ShoppingBag': ShoppingBag,
    'Stethoscope': Stethoscope,
    'Bike': Bike,
    'UtensilsCrossed': UtensilsCrossed,
    'CreditCard': CreditCard,
    'Cross': Cross,
    'Dumbbell': Dumbbell,
    'GraduationCap': GraduationCap,
    'Train': Train,
};

export default function NearbyPlaces({ property, location }) {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const parseCoords = (mapLocation) => {
        if (!mapLocation || typeof mapLocation !== 'string') return null;
        const parts = mapLocation.split(',').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
        return null;
    };

    const fetchNearby = async () => {
        setLoading(true);
        setError(null);

        try {
            let data = null;

            // Try coordinates first
            if (property?.mapLocation) {
                const coords = parseCoords(property.mapLocation);
                if (coords) {
                    data = await nearbyService.getNearbyAmenities(coords);
                }
            }

            // Try location.coordinates array
            if (!data && property?.location?.coordinates?.length === 2) {
                const [lng, lat] = property.location.coordinates;
                if (lat && lng) {
                    data = await nearbyService.getNearbyAmenities({ lat, lng });
                }
            }

            // Fallback to address
            if (!data && (property?.address || property?.city || location)) {
                data = await nearbyService.getNearbyAmenitiesByAddress(
                    property?.address || '',
                    property?.city || location || ''
                );
            }

            if (data?.success && data.amenities?.length > 0) {
                setPlaces(data.amenities);
            } else {
                setError('No nearby places found');
            }
        } catch (err) {
            setError(err.message || 'Failed to load nearby places');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNearby();
    }, [property, location]);

    const displayLocation = property?.city || location || 'This Area';

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-foreground">{displayLocation}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Nearby Places</p>
                    </div>
                    {error && (
                        <button
                            onClick={fetchNearby}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Retry"
                        >
                            <RefreshCw className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-5">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Finding nearby places...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="text-center py-8">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground mb-3">{error}</p>
                        <button
                            onClick={fetchNearby}
                            className="text-xs text-primary hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && places.length === 0 && (
                    <div className="text-center py-8">
                        <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">No nearby places found</p>
                    </div>
                )}

                {!loading && !error && places.length > 0 && (
                    <div className="space-y-2">
                        {places.map((place, idx) => {
                            const Icon = ICON_MAP[place.icon] || MapPin;
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br ${place.color || 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900'} border border-border/50 hover:border-border transition-colors`}
                                >
                                    <div className="p-2 rounded-lg bg-card/80 flex-shrink-0">
                                        <Icon className={`w-4 h-4 ${place.iconColor || 'text-primary'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {place.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {place.type} • {place.distance}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
