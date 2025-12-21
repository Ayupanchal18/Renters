'use client'

import React, { useState, useEffect } from 'react'
import { 
    MapPin, 
    Landmark, 
    ShoppingBag, 
    Building2, 
    Bike, 
    Stethoscope, 
    UtensilsCrossed,
    CreditCard,
    Cross,
    Dumbbell,
    Loader2,
    AlertCircle,
    RefreshCw
} from 'lucide-react'
import nearbyService from '../../api/nearbyService'

export default function NearbyRecommendations({ property, location }) {
    const [recommendations, setRecommendations] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)

    // Icon mapping for dynamic icons
    const iconMap = {
        'Landmark': Landmark,
        'Building2': Building2,
        'ShoppingBag': ShoppingBag,
        'Stethoscope': Stethoscope,
        'Bike': Bike,
        'UtensilsCrossed': UtensilsCrossed,
        'CreditCard': CreditCard,
        'Cross': Cross,
        'Dumbbell': Dumbbell
    }

    // Parse mapLocation string to coordinates
    const parseMapLocation = (mapLocation) => {
        if (!mapLocation || typeof mapLocation !== 'string') return null
        const parts = mapLocation.split(',').map(p => parseFloat(p.trim()))
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] }
        }
        return null
    }

    // Fetch nearby amenities when component mounts or property changes
    useEffect(() => {
        const fetchNearbyAmenities = async () => {
            if (!property && !location) {
                setError('No location information available')
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                let nearbyData

                // Priority 1: Use mapLocation string (format: "lat, lng")
                if (property?.mapLocation) {
                    const coords = parseMapLocation(property.mapLocation)
                    if (coords) {
                        nearbyData = await nearbyService.getNearbyAmenities(coords)
                    }
                }

                // Priority 2: Use location.coordinates array [lng, lat]
                if (!nearbyData && property?.location?.coordinates && 
                    Array.isArray(property.location.coordinates) && 
                    property.location.coordinates.length === 2) {
                    
                    const [lng, lat] = property.location.coordinates
                    if (lat && lng && lat !== 0 && lng !== 0) {
                        nearbyData = await nearbyService.getNearbyAmenities({ lat, lng })
                    }
                }

                // Priority 3: Fallback to address-based search
                if (!nearbyData && (property?.address || property?.city || location)) {
                    const address = property?.address || ''
                    const city = property?.city || location || ''
                    nearbyData = await nearbyService.getNearbyAmenitiesByAddress(address, city)
                }

                if (nearbyData?.success && nearbyData.amenities && nearbyData.amenities.length > 0) {
                    setRecommendations(nearbyData.amenities)
                } else {
                    throw new Error(nearbyData?.error || 'No nearby amenities found')
                }
            } catch (err) {
                console.warn('Nearby amenities:', err.message)
                setError(err.message || 'Failed to load nearby recommendations')
            } finally {
                setIsLoading(false)
            }
        }

        fetchNearbyAmenities()
    }, [property, location, retryCount])

    // Retry function
    const handleRetry = () => {
        setRetryCount(prev => prev + 1)
    }

    // Get display location
    const displayLocation = property?.city || location || 'Unknown Location'

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900">{displayLocation}</h3>
                        <p className="text-xs font-medium text-slate-600 mt-1">Nearby Recommendations</p>
                    </div>
                    {error && (
                        <button
                            onClick={handleRetry}
                            className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
                            title="Retry loading nearby amenities"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Finding nearby amenities...</span>
                        </div>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex items-center gap-2 text-slate-500 mb-3">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Unable to load nearby amenities</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 max-w-xs">
                            {error === 'No location information available' 
                                ? 'Location information is not available for this property'
                                : 'There was an issue loading nearby recommendations. Please try again.'
                            }
                        </p>
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Try Again
                        </button>
                    </div>
                )}

                {!isLoading && !error && recommendations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex items-center gap-2 text-slate-500 mb-3">
                            <MapPin className="w-5 h-5" />
                            <span className="text-sm font-medium">No nearby amenities found</span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-xs">
                            We couldn't find any nearby points of interest for this location.
                        </p>
                    </div>
                )}

                {!isLoading && !error && recommendations.length > 0 && (
                    <div className="space-y-2.5">
                        {recommendations.map((item, idx) => {
                            const Icon = iconMap[item.icon] || MapPin
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br ${item.color} border border-slate-200/50 hover:border-slate-300 hover:shadow-sm transition-all group cursor-pointer`}
                                >
                                    <div className="mt-0.5 p-2 rounded-lg bg-white/70 group-hover:bg-white transition-colors flex-shrink-0">
                                        <Icon className={`w-4 h-4 ${item.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                        <p className="text-xs font-medium text-slate-600">
                                            {item.type} • {item.distance}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
