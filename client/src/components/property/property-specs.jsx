import React from 'react';
import { Bed, Bath, Maximize, Layers, Compass, Car, Calendar, Home, Users, ChefHat } from 'lucide-react';

export default function PropertySpecs({ property, isRoomType }) {
    const specs = [];

    if (isRoomType) {
        // Room/PG/Hostel specific specs
        if (property.roomType) {
            specs.push({ icon: Users, label: 'Room Type', value: property.roomType, color: 'blue' });
        }
        if (property.bathroomType) {
            specs.push({ icon: Bath, label: 'Bathroom', value: property.bathroomType, color: 'cyan' });
        }
        specs.push({ 
            icon: ChefHat, 
            label: 'Kitchen', 
            value: property.kitchenAvailable ? 'Available' : 'Not Available', 
            color: property.kitchenAvailable ? 'green' : 'slate' 
        });
    } else {
        // Flat/House specs
        if (property.bedrooms) {
            specs.push({ icon: Bed, label: 'Bedrooms', value: property.bedrooms, color: 'blue' });
        }
        if (property.bathrooms) {
            specs.push({ icon: Bath, label: 'Bathrooms', value: property.bathrooms, color: 'cyan' });
        }
        if (property.balconies) {
            specs.push({ icon: Home, label: 'Balconies', value: property.balconies, color: 'green' });
        }
    }

    // Common specs
    if (property.builtUpArea) {
        specs.push({ icon: Maximize, label: 'Built-up Area', value: `${property.builtUpArea} sq.ft`, color: 'purple' });
    }
    if (property.carpetArea) {
        specs.push({ icon: Maximize, label: 'Carpet Area', value: `${property.carpetArea} sq.ft`, color: 'violet' });
    }
    if (property.floorNumber !== undefined && property.floorNumber !== null) {
        const floorText = property.totalFloors ? `${property.floorNumber} of ${property.totalFloors}` : property.floorNumber;
        specs.push({ icon: Layers, label: 'Floor', value: floorText, color: 'orange' });
    }
    if (property.facingDirection) {
        specs.push({ icon: Compass, label: 'Facing', value: property.facingDirection, color: 'amber' });
    }
    if (property.parking) {
        specs.push({ icon: Car, label: 'Parking', value: property.parking, color: 'emerald' });
    }
    if (property.propertyAge) {
        specs.push({ icon: Calendar, label: 'Property Age', value: property.propertyAge, color: 'rose' });
    }

    if (specs.length === 0) return null;

    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
        green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
        purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
        orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };

    return (
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Property Details</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {specs.map((spec, idx) => {
                    const Icon = spec.icon;
                    return (
                        <div 
                            key={idx}
                            className={`${colorClasses[spec.color]} rounded-xl p-4 text-center transition-transform hover:scale-105`}
                        >
                            <Icon className="w-5 h-5 mx-auto mb-2 opacity-80" />
                            <p className="text-lg font-bold capitalize">{spec.value}</p>
                            <p className="text-xs font-medium opacity-70 mt-1">{spec.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
