import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Home (Property) icon
const homeIcon = L.divIcon({
    html: `
        <div class="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-lg animate-pulse" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground))">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
    `,
    className: "custom-home-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

// Category-specific amenity pin
const createAmenityIcon = (index, isSelected) => {
    const bgClass = isSelected ? "bg-primary border-primary text-white" : "bg-secondary border-secondary text-white";
    const bgStyle = isSelected ? "background: hsl(var(--primary))" : "background: hsl(var(--secondary))";
    const scaleClass = isSelected ? "scale-125 z-40 border-primary" : "scale-100 z-10 border-white";

    return L.divIcon({
        html: `
            <div class="flex items-center justify-center w-7 h-7 rounded-full border-2 shadow-md font-bold text-[10px] transition-all duration-300 ${bgClass} ${scaleClass}" style="${bgStyle}">
                ${index + 1}
            </div>
        `,
        className: "custom-amenity-pin",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
};

// Map controller to fly to active marker coordinates
function MapController({ propertyCoords, selectedAmenity }) {
    const map = useMap();
    const prevSelectedRef = useRef(null);

    useEffect(() => {
        if (selectedAmenity) {
            // Fly to selected amenity coords
            map.flyTo([selectedAmenity.lat, selectedAmenity.lng], 16, {
                animate: true,
                duration: 1.2
            });
            prevSelectedRef.current = selectedAmenity;
        } else if (propertyCoords && prevSelectedRef.current) {
            // Return back to property center
            map.flyTo(propertyCoords, 14, {
                animate: true,
                duration: 1.0
            });
            prevSelectedRef.current = null;
        }
    }, [propertyCoords, selectedAmenity, map]);

    return null;
}

export function NeighborhoodMap({
    propertyCoords = [0, 0], // [lat, lng]
    amenities = [],
    selectedAmenity = null
}) {
    const mapRef = useRef(null);

    // Filter out invalid amenities coordinates
    const validAmenities = amenities.filter(a => a.lat && a.lng);

    return (
        <div className="w-full h-[280px] rounded-2xl overflow-hidden border border-border/60 shadow-sm relative z-0">
            <MapContainer
                center={propertyCoords}
                zoom={14}
                ref={mapRef}
                className="w-full h-full"
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Property Marker */}
                <Marker position={propertyCoords} icon={homeIcon}>
                    <Popup>
                        <div className="text-xs font-bold text-center">
                            Property Location
                        </div>
                    </Popup>
                </Marker>

                {/* Amenity Markers */}
                {validAmenities.map((item, idx) => {
                    const isSelected = selectedAmenity && 
                        selectedAmenity.name === item.name && 
                        selectedAmenity.lat === item.lat && 
                        selectedAmenity.lng === item.lng;

                    return (
                        <Marker
                            key={`${item.name}_${idx}`}
                            position={[item.lat, item.lng]}
                            icon={createAmenityIcon(idx, isSelected)}
                        >
                            <Popup>
                                <div className="text-xs space-y-0.5">
                                    <h5 className="font-bold text-foreground leading-tight">{item.name}</h5>
                                    <p className="text-[10px] text-muted-foreground capitalize">{item.category}</p>
                                    <p className="text-[10px] text-primary font-semibold mt-1">
                                        Distance: {item.distance < 1000 ? `${item.distance} m` : `${(item.distance / 1000).toFixed(1)} km`}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                <MapController
                    propertyCoords={propertyCoords}
                    selectedAmenity={selectedAmenity}
                />
            </MapContainer>
        </div>
    );
}
