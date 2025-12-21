/**
 * PropertyHeader Component
 * 
 * Displays property title, basic information, verification status, and action buttons.
 * Implements proper data validation and fallback handling for missing data.
 * 
 * Requirements: 1.1, 1.2, 8.2
 */


import React from 'react';
import { Heart, Share2, MapPin, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { PropertyDataValidator } from '../../utils/PropertyDataValidator';
import { fallbackDataGenerator } from '../../utils/FallbackDataGenerator';

// Create validator instance
const propertyDataValidator = new PropertyDataValidator();

const PropertyHeader = ({ 
    property = {}, 
    isFavorited = false, 
    onToggleFavorite, 
    onShare,
    className = "" 
}) => {
    // Validate and transform property data
    const validationResult = propertyDataValidator.validateAndTransform(property);
    const validatedProperty = validationResult.property;

    // Helper function to capitalize first letter
    const capitalizeFirstLetter = (text) => {
        if (!text || typeof text !== 'string') return 'Not specified';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    };

    // Helper function to format date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date not available';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Date not available';
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return 'Date not available';
        }
    };

    // Get verification status with fallback
    const getVerificationStatus = () => {
        const status = validatedProperty.verificationStatus?.toLowerCase();
        
        switch (status) {
            case 'verified':
                return {
                    text: 'Verified',
                    variant: 'default',
                    className: 'bg-green-100 text-green-800 border-green-200',
                    icon: CheckCircle
                };
            case 'pending':
                return {
                    text: 'Pending Verification',
                    variant: 'secondary',
                    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    icon: Clock
                };
            case 'unverified':
            default:
                return {
                    text: 'Unverified',
                    variant: 'outline',
                    className: 'bg-gray-100 text-gray-600 border-gray-200',
                    icon: AlertCircle
                };
        }
    };

    // Handle share functionality
    const handleShare = () => {
        if (onShare) {
            onShare();
        } else if (navigator.share) {
            navigator.share({
                title: validatedProperty.title || 'Property Listing',
                text: `Check out this property: ${validatedProperty.title || 'Property Available'}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).catch(console.error);
        }
    };

    // Handle favorite toggle
    const handleToggleFavorite = () => {
        if (onToggleFavorite) {
            onToggleFavorite();
        }
    };

    const verificationStatus = getVerificationStatus();
    const VerificationIcon = verificationStatus.icon;

    return (
        <div className={`property-card animate-fade-in ${className}`}>
            <div className="property-card-content">
                {/* Title and Action Buttons */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-responsive-lg font-bold text-slate-900 leading-tight">
                            {validatedProperty.title || 'Property Title Not Available'}
                            {validatedProperty._hasGeneratedTitle && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                    (Generated)
                                </span>
                            )}
                        </h1>
                    </div>

                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                            onClick={handleShare}
                            className="touch-target p-2 hover:bg-amber-50 rounded-lg text-slate-600 hover:text-amber-700 transition-colors focus-visible-enhanced"
                            title="Share property"
                            aria-label="Share property"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleToggleFavorite}
                            className="touch-target p-2 hover:bg-red-50 rounded-lg transition-colors focus-visible-enhanced"
                            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Heart
                                className={`w-4 h-4 transition-all duration-200 ${
                                    isFavorited
                                        ? "fill-red-500 text-red-500 animate-bounce-gentle"
                                        : "text-slate-600 hover:text-red-500 hover:scale-110"
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 text-responsive-xs text-slate-600 mb-3">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-blue-600" />
                    <span className="truncate">
                        {validatedProperty.formattedAddress || validatedProperty.address || 'Address not available'}
                        {validatedProperty._hasGeneratedAddress && (
                            <span className="ml-1 text-gray-400">(Generated)</span>
                        )}
                    </span>
                </div>

                {/* Property Badges */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {/* Category Badge */}
                    <Badge 
                        variant="secondary" 
                        className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 transition-colors animate-stagger-1"
                    >
                        {capitalizeFirstLetter(validatedProperty.category) || 'Property'}
                    </Badge>

                    {/* Property Type Badge */}
                    {validatedProperty.propertyType && (
                        <Badge 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors animate-stagger-2"
                        >
                            {capitalizeFirstLetter(validatedProperty.propertyType)}
                            {validatedProperty._hasGeneratedPropertyType && (
                                <span className="ml-1 text-xs opacity-60">(Auto)</span>
                            )}
                        </Badge>
                    )}

                    {/* Furnishing Badge */}
                    {validatedProperty.furnishing && (
                        <Badge 
                            variant="secondary" 
                            className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors animate-stagger-3"
                        >
                            {capitalizeFirstLetter(validatedProperty.furnishing)}
                            {validatedProperty._hasGeneratedFurnishing && (
                                <span className="ml-1 text-xs opacity-60">(Auto)</span>
                            )}
                        </Badge>
                    )}

                    {/* Posted Date Badge */}
                    <Badge 
                        variant="outline" 
                        className="bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1 animate-stagger-4"
                    >
                        <Calendar className="w-3 h-3" />
                        <span className="hidden sm:inline">Posted </span>
                        {formatDate(validatedProperty.createdAt)}
                    </Badge>

                    {/* Verification Status Badge */}
                    <Badge 
                        variant={verificationStatus.variant}
                        className={`${verificationStatus.className} flex items-center gap-1 animate-stagger-5`}
                    >
                        <VerificationIcon className="w-3 h-3" />
                        {verificationStatus.text}
                    </Badge>

                    {/* Availability Badge */}
                    {validatedProperty.availableFrom && (
                        <Badge 
                            variant="secondary" 
                            className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 animate-slide-up"
                        >
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">Available </span>
                            {formatDate(validatedProperty.availableFrom)}
                            {validatedProperty._hasGeneratedAvailability && (
                                <span className="ml-1 text-xs opacity-60">(Auto)</span>
                            )}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Validation Warnings (Development Mode) */}
            {process.env.NODE_ENV === 'development' && validationResult.hasWarnings && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    <strong>Data Warnings:</strong>
                    <ul className="mt-1 list-disc list-inside">
                        {validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Fallback Data Indicator (Development Mode) */}
            {process.env.NODE_ENV === 'development' && validationResult.hasFallbacks && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <strong>Using Fallback Data:</strong> Some information was generated automatically due to missing data.
                </div>
            )}
        </div>
    );
};

export default PropertyHeader;