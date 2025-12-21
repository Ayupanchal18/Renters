import React from 'react';
import { MapPin, CheckCircle, Clock, AlertCircle, Building2 } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function PropertyOverview({ property, formatDate }) {
    const getVerificationBadge = () => {
        const status = property.verificationStatus?.toLowerCase();
        switch (status) {
            case 'verified':
                return { icon: CheckCircle, text: 'Verified', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' };
            case 'pending':
                return { icon: Clock, text: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' };
            default:
                return { icon: AlertCircle, text: 'Unverified', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
        }
    };

    const verification = getVerificationBadge();
    const VerificationIcon = verification.icon;

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

    // Build address string
    const addressParts = [property.locality, property.city, property.state].filter(Boolean);
    const fullAddress = addressParts.join(', ') || property.address || 'Location not specified';

    return (
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6 space-y-4">
            {/* Title & Badges */}
            <div>
                <div className="flex flex-wrap items-start gap-2 mb-3">
                    <Badge className={`${verification.className} border flex items-center gap-1`}>
                        <VerificationIcon className="w-3 h-3" />
                        {verification.text}
                    </Badge>
                    {property.category && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {capitalize(property.category)}
                        </Badge>
                    )}
                    {property.propertyType && (
                        <Badge variant="outline" className="text-muted-foreground">
                            <Building2 className="w-3 h-3 mr-1" />
                            {capitalize(property.propertyType)}
                        </Badge>
                    )}
                </div>
                
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                    {property.title || 'Property Title'}
                </h1>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span className="text-sm sm:text-base">{fullAddress}</span>
            </div>

            {/* Description */}
            {property.description && (
                <div className="pt-4 border-t border-border">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {property.description}
                    </p>
                </div>
            )}

            {/* Quick Info Tags */}
            {(property.furnishing || property.availableFrom) && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                    {property.furnishing && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Furnishing:</span>
                            <span className="font-medium text-foreground capitalize">
                                {property.furnishing === 'semi' ? 'Semi-Furnished' : 
                                 property.furnishing === 'fully' ? 'Fully Furnished' : 
                                 property.furnishing === 'unfurnished' ? 'Unfurnished' : property.furnishing}
                            </span>
                        </div>
                    )}
                    {property.availableFrom && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Available:</span>
                            <span className="font-medium text-foreground">{formatDate(property.availableFrom)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
