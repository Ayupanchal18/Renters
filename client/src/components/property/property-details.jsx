import React, { useState, useMemo } from 'react'
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'
import { PropertyDataValidator } from '../../utils/PropertyDataValidator'
import { DataTransformationUtils } from '../../utils/DataTransformationUtils'

export default function PropertyDetails({ property }) {
    const [expandedSections, setExpandedSections] = useState({
        overview: true,
        financial: true,
        amenities: true,
        specs: true,
    })

    // Initialize utilities
    const validator = useMemo(() => new PropertyDataValidator(), [])
    const transformer = useMemo(() => new DataTransformationUtils(), [])

    // Validate and transform property data
    const processedData = useMemo(() => {
        if (!property) {
            return validator.createEmptyPropertyWithFallbacks()
        }
        
        const validationResult = validator.validateAndTransform(property)
        const transformedProperty = transformer.transformPropertyForDisplay(validationResult.property)
        
        return {
            ...validationResult,
            transformed: transformedProperty
        }
    }, [property, validator, transformer])

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    // Get processed property data
    const propertyData = processedData.property || {}
    const transformedData = processedData.transformed || {}
    const hasWarnings = processedData.hasWarnings
    const hasFallbacks = processedData.hasFallbacks

    // Determine category type for smart field display
    const isRoomType = ['room', 'pg', 'hostel'].includes(property?.category)
    const isResidential = ['flat', 'house'].includes(property?.category)
    const isCommercial = property?.category === 'commercial'

    // Helper to check if a value is valid (not null, undefined, empty string, or 0 for certain fields)
    const hasValue = (val, allowZero = false) => {
        if (val === null || val === undefined || val === '') return false
        if (!allowZero && val === 0) return false
        return true
    }

    // Format furnishing display
    const formatFurnishing = (val) => {
        const map = { unfurnished: 'Unfurnished', semi: 'Semi-Furnished', fully: 'Fully Furnished' }
        return map[val] || val || 'Not specified'
    }

    return (
        <div className="space-responsive animate-fade-in">
            {/* Data Quality Indicator */}
            {(hasWarnings || hasFallbacks) && (
                <div className="warning-state animate-slide-down">
                    <div className="warning-state-content">
                        <AlertCircle className="warning-state-icon" />
                        <span className="warning-state-text">
                            {hasFallbacks ? 'Some information is using default values' : 'Property information verified'}
                        </span>
                    </div>
                </div>
            )}

            {/* Overview Section */}
            <div className="property-card animate-stagger-1">
                <button
                    onClick={() => toggleSection('overview')}
                    className="property-card-header w-full flex items-center justify-between hover:bg-slate-100 transition-colors focus-visible-enhanced"
                >
                    <span className="text-responsive-base font-bold text-slate-900">Overview</span>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${expandedSections.overview ? 'rotate-180' : ''}`}
                    />
                </button>

                {expandedSections.overview && (
                    <div className="property-card-content border-t border-slate-200 animate-slide-down">
                        {/* Description */}
                        <div className="mb-6">
                            <p className="text-responsive-sm text-slate-700 leading-relaxed">
                                {propertyData.description || 'Property description not available.'}
                                {propertyData._hasGeneratedDescription && (
                                    <span className="text-xs text-amber-600 ml-2">(Generated)</span>
                                )}
                            </p>
                        </div>

                        {/* Property Specifications Grid - Smart display based on category */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Always show: Property Type */}
                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Property Type
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {property?.propertyType || 'Not specified'}
                                </p>
                            </div>

                            {/* Always show: Category */}
                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Category
                                </p>
                                <p className="text-sm font-semibold text-slate-900 capitalize">
                                    {property?.category || 'Not specified'}
                                </p>
                            </div>

                            {/* Always show: Furnishing */}
                            <div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                    Furnishing
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {formatFurnishing(property?.furnishing)}
                                </p>
                            </div>

                            {/* Room-specific fields */}
                            {isRoomType && (
                                <>
                                    {hasValue(property?.roomType) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Room Type
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900 capitalize">
                                                {property.roomType}
                                            </p>
                                        </div>
                                    )}
                                    {hasValue(property?.bathroomType) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Bathroom
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900 capitalize">
                                                {property.bathroomType}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                            Kitchen
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {property?.kitchenAvailable ? 'Available' : 'Not Available'}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Residential fields (flat/house) */}
                            {isResidential && (
                                <>
                                    {hasValue(property?.bedrooms) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Bedrooms
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {property.bedrooms}
                                            </p>
                                        </div>
                                    )}
                                    {hasValue(property?.bathrooms) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Bathrooms
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {property.bathrooms}
                                            </p>
                                        </div>
                                    )}
                                    {hasValue(property?.balconies) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Balconies
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {property.balconies}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Area fields - show if available for any category */}
                            {hasValue(property?.builtUpArea) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Built-up Area
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {property.builtUpArea} sq.ft
                                    </p>
                                </div>
                            )}
                            {hasValue(property?.carpetArea) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Carpet Area
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {property.carpetArea} sq.ft
                                    </p>
                                </div>
                            )}

                            {/* Floor info - show if available */}
                            {hasValue(property?.floorNumber) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Floor
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {property.floorNumber}{hasValue(property?.totalFloors) ? ` of ${property.totalFloors}` : ''}
                                    </p>
                                </div>
                            )}

                            {/* Facing direction - show if available */}
                            {hasValue(property?.facingDirection) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Facing
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 capitalize">
                                        {property.facingDirection}
                                    </p>
                                </div>
                            )}

                            {/* Parking - show if available */}
                            {hasValue(property?.parking) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Parking
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900 capitalize">
                                        {property.parking}
                                    </p>
                                </div>
                            )}

                            {/* Property Age - show if available */}
                            {hasValue(property?.propertyAge) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Property Age
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {property.propertyAge}
                                    </p>
                                </div>
                            )}

                            {/* Commercial-specific fields */}
                            {isCommercial && (
                                <>
                                    {hasValue(property?.washroom) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Washroom
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {property.washroom}
                                            </p>
                                        </div>
                                    )}
                                    {hasValue(property?.frontage) && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                                Frontage
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {property.frontage}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Availability */}
                            {hasValue(property?.availableFrom) && (
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        Available From
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {new Date(property.availableFrom).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Information Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <button
                    onClick={() => toggleSection('financial')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <span className="font-bold text-slate-900">Financial Details</span>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform ${expandedSections.financial ? 'rotate-180' : ''}`}
                    />
                </button>

                {expandedSections.financial && (
                    <div className="px-4 py-4 border-t border-slate-200 space-y-4">
                        {/* Monthly Rent */}
                        {transformedData.financial?.monthlyRent?.hasValue && (
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-blue-900">Monthly Rent</span>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-blue-900">
                                        {transformedData.financial.monthlyRent.display}
                                    </span>
                                    {propertyData.negotiable && (
                                        <span className="block text-xs text-blue-700">Negotiable</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Price per square foot */}
                        {transformedData.financial?.pricePerSqft?.hasValue && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">Price per sq ft</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {transformedData.financial.pricePerSqft.display}
                                </span>
                            </div>
                        )}

                        {/* Security Deposit */}
                        {transformedData.financial?.securityDeposit?.hasValue && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Security Deposit</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {transformedData.financial.securityDeposit.display}
                                </span>
                            </div>
                        )}

                        {/* Maintenance Charge */}
                        {transformedData.financial?.maintenanceCharge?.hasValue && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Maintenance Charge</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {transformedData.financial.maintenanceCharge.display}
                                </span>
                            </div>
                        )}

                        {/* Total Monthly Cost */}
                        {transformedData.financial?.totalMonthlyCost?.hasValue && (
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t border-green-200">
                                <span className="text-sm font-medium text-green-900">Total Monthly Cost</span>
                                <span className="text-lg font-bold text-green-900">
                                    {transformedData.financial.totalMonthlyCost.display}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <button
                    onClick={() => toggleSection('amenities')}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Property Features</span>
                        {transformedData.amenities?.count > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                {transformedData.amenities.count}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform ${expandedSections.amenities ? 'rotate-180' : ''}`}
                    />
                </button>

                {expandedSections.amenities && (
                    <div className="px-4 py-4 border-t border-slate-200">
                        {transformedData.amenities?.hasAmenities ? (
                            <div className="grid grid-cols-2 gap-2">
                                {transformedData.amenities.display.map((amenity, index) => (
                                    <div
                                        key={`${amenity.display}-${index}`}
                                        className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                                    >
                                        <span className="text-sm group-hover:scale-110 transition-transform">
                                            {amenity.icon}
                                        </span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {amenity.display}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="text-slate-400 mb-2">
                                    <CheckCircle className="w-8 h-8 mx-auto" />
                                </div>
                                <p className="text-sm text-slate-600">
                                    {propertyData._hasDefaultAmenities 
                                        ? 'Basic amenities included' 
                                        : 'No specific amenities listed'
                                    }
                                </p>
                                {propertyData._hasDefaultAmenities && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        Contact owner for detailed amenity information
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Additional property features if available */}
                        {(transformedData.specifications?.parking?.hasValue || 
                          transformedData.specifications?.facingDirection?.hasValue) && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Additional Features</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {transformedData.specifications?.parking?.hasValue && (
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                                            <span className="text-sm">🚗</span>
                                            <div>
                                                <p className="text-xs text-green-700 font-medium">Parking</p>
                                                <p className="text-sm text-green-900">
                                                    {transformedData.specifications.parking.display}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {transformedData.specifications?.facingDirection?.hasValue && (
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50">
                                            <span className="text-sm">🧭</span>
                                            <div>
                                                <p className="text-xs text-yellow-700 font-medium">Facing</p>
                                                <p className="text-sm text-yellow-900">
                                                    {transformedData.specifications.facingDirection.display}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}