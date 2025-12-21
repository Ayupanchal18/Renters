import React, { useState } from 'react';
import { ChevronDown, Wifi, Car, Dumbbell, Shield, Droplets, Zap, Wind, Tv, Refrigerator, WashingMachine, Sofa, UtensilsCrossed, Trees, Building, Users, Clock, Sparkles } from 'lucide-react';

const AMENITY_CONFIG = {
    // Connectivity
    wifi: { icon: Wifi, label: 'WiFi', category: 'connectivity' },
    internet: { icon: Wifi, label: 'Internet', category: 'connectivity' },
    
    // Parking & Security
    parking: { icon: Car, label: 'Parking', category: 'facilities' },
    security: { icon: Shield, label: '24/7 Security', category: 'facilities' },
    cctv: { icon: Shield, label: 'CCTV', category: 'facilities' },
    
    // Fitness & Recreation
    gym: { icon: Dumbbell, label: 'Gym', category: 'recreation' },
    swimming: { icon: Droplets, label: 'Swimming Pool', category: 'recreation' },
    pool: { icon: Droplets, label: 'Swimming Pool', category: 'recreation' },
    garden: { icon: Trees, label: 'Garden', category: 'recreation' },
    
    // Utilities
    powerBackup: { icon: Zap, label: 'Power Backup', category: 'utilities' },
    power: { icon: Zap, label: 'Power Backup', category: 'utilities' },
    water: { icon: Droplets, label: 'Water Supply', category: 'utilities' },
    ac: { icon: Wind, label: 'Air Conditioning', category: 'utilities' },
    geyser: { icon: Droplets, label: 'Geyser', category: 'utilities' },
    
    // Appliances
    tv: { icon: Tv, label: 'TV', category: 'appliances' },
    fridge: { icon: Refrigerator, label: 'Refrigerator', category: 'appliances' },
    refrigerator: { icon: Refrigerator, label: 'Refrigerator', category: 'appliances' },
    washingMachine: { icon: WashingMachine, label: 'Washing Machine', category: 'appliances' },
    washing: { icon: WashingMachine, label: 'Washing Machine', category: 'appliances' },
    
    // Furniture
    sofa: { icon: Sofa, label: 'Sofa', category: 'furniture' },
    bed: { icon: Sofa, label: 'Bed', category: 'furniture' },
    wardrobe: { icon: Sofa, label: 'Wardrobe', category: 'furniture' },
    
    // Services
    housekeeping: { icon: Sparkles, label: 'Housekeeping', category: 'services' },
    laundry: { icon: WashingMachine, label: 'Laundry', category: 'services' },
    meals: { icon: UtensilsCrossed, label: 'Meals', category: 'services' },
    
    // Building
    lift: { icon: Building, label: 'Lift', category: 'building' },
    elevator: { icon: Building, label: 'Elevator', category: 'building' },
    clubhouse: { icon: Users, label: 'Clubhouse', category: 'building' },
    
    // Default
    default: { icon: Sparkles, label: 'Amenity', category: 'other' }
};

export default function PropertyAmenities({ property }) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Extract amenities from property
    const getAmenities = () => {
        const amenities = [];
        
        // Check amenities array
        if (Array.isArray(property.amenities)) {
            property.amenities.forEach(amenity => {
                const key = typeof amenity === 'string' ? amenity.toLowerCase().replace(/\s+/g, '') : '';
                const config = AMENITY_CONFIG[key] || { ...AMENITY_CONFIG.default, label: amenity };
                amenities.push({ ...config, key });
            });
        }
        
        // Check individual amenity fields
        const amenityFields = [
            { field: 'hasWifi', key: 'wifi' },
            { field: 'hasParking', key: 'parking' },
            { field: 'hasGym', key: 'gym' },
            { field: 'hasSecurity', key: 'security' },
            { field: 'hasPowerBackup', key: 'powerBackup' },
            { field: 'hasLift', key: 'lift' },
            { field: 'hasAC', key: 'ac' },
            { field: 'hasTV', key: 'tv' },
            { field: 'hasFridge', key: 'fridge' },
            { field: 'hasWashingMachine', key: 'washingMachine' },
            { field: 'hasGeyser', key: 'geyser' },
        ];

        amenityFields.forEach(({ field, key }) => {
            if (property[field] && !amenities.find(a => a.key === key)) {
                amenities.push({ ...AMENITY_CONFIG[key], key });
            }
        });

        return amenities;
    };

    const amenities = getAmenities();

    if (amenities.length === 0) return null;

    // Group by category
    const grouped = amenities.reduce((acc, amenity) => {
        const cat = amenity.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(amenity);
        return acc;
    }, {});

    const categoryLabels = {
        connectivity: 'Connectivity',
        facilities: 'Facilities',
        recreation: 'Recreation',
        utilities: 'Utilities',
        appliances: 'Appliances',
        furniture: 'Furniture',
        services: 'Services',
        building: 'Building',
        other: 'Other'
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">Amenities & Features</h2>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {amenities.length}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-6">
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                {categoryLabels[category]}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {items.map((amenity, idx) => {
                                    const Icon = amenity.icon;
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span className="text-sm font-medium text-foreground truncate">
                                                {amenity.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
