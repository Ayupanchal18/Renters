/**
 * Data Transformation Utils
 * 
 * **Feature: property-details-optimization, Task 1: Set up enhanced data handling and validation utilities**
 * 
 * Provides data transformation utilities for consistent property display:
 * - Formats currency values consistently
 * - Transforms property data for display
 * - Handles number parsing and formatting
 * - Creates display-ready data structures
 * 
 * Requirements: 1.2, 4.5, 5.4, 8.5
 */
export class DataTransformationUtils {
    constructor() {
        this.currencyFormatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        this.numberFormatter = new Intl.NumberFormat('en-IN');
    }

    /**
     * Transform property data for display
     * @param {Object} property - Validated property data
     * @returns {Object} Transformed data ready for display
     */
    transformPropertyForDisplay(property) {
        if (!property) return {};

        return {
            displayNames: this._transformDisplayNames(property),
            specifications: this._transformSpecifications(property),
            financial: this._transformFinancialData(property),
            amenities: this._transformAmenities(property),
            dates: this._transformDates(property),
            location: this._transformLocation(property)
        };
    }

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return 'Not specified';
        }

        if (amount === 0) {
            return 'Free';
        }

        return this.currencyFormatter.format(amount);
    }

    /**
     * Parse number from various input types
     * @param {*} value - Value to parse as number
     * @returns {number} Parsed number or 0
     */
    parseNumber(value) {
        if (typeof value === 'number' && !isNaN(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
            return isNaN(parsed) ? 0 : parsed;
        }

        return 0;
    }

    /**
     * Format number with commas
     * @param {number} number - Number to format
     * @returns {string} Formatted number string
     */
    formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return 'N/A';
        }
        return this.numberFormatter.format(number);
    }

    /**
     * Transform display names
     * @private
     */
    _transformDisplayNames(property) {
        return {
            propertyType: {
                value: property.propertyType,
                display: this._capitalizeFirst(property.propertyType || 'Not specified'),
                hasValue: !!property.propertyType
            },
            category: {
                value: property.category,
                display: this._capitalizeFirst(property.category || 'Not specified'),
                hasValue: !!property.category
            },
            furnishing: {
                value: property.furnishing,
                display: this._capitalizeFirst(property.furnishing || 'Not specified'),
                hasValue: !!property.furnishing
            }
        };
    }

    /**
     * Transform specifications
     * @private
     */
    _transformSpecifications(property) {
        return {
            bedrooms: {
                value: property.bedrooms,
                display: property.bedrooms ? `${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}` : 'Not specified',
                hasValue: !!property.bedrooms
            },
            bathrooms: {
                value: property.bathrooms,
                display: property.bathrooms ? `${property.bathrooms} Bathroom${property.bathrooms > 1 ? 's' : ''}` : 'Not specified',
                hasValue: !!property.bathrooms
            },
            builtUpArea: {
                value: property.builtUpArea,
                display: property.builtUpArea ? `${this.formatNumber(property.builtUpArea)} sqft` : 'Not specified',
                hasValue: !!property.builtUpArea
            },
            carpetArea: {
                value: property.carpetArea,
                display: property.carpetArea ? `${this.formatNumber(property.carpetArea)} sqft` : 'Not specified',
                hasValue: !!property.carpetArea
            },
            balconies: {
                value: property.balconies,
                display: property.balconies ? `${property.balconies} Balcon${property.balconies > 1 ? 'ies' : 'y'}` : 'Not specified',
                hasValue: !!property.balconies
            },
            floorNumber: {
                value: property.floorNumber,
                display: property.floorNumber !== null && property.floorNumber !== undefined
                    ? `Floor ${property.floorNumber}${property.totalFloors ? ` of ${property.totalFloors}` : ''}`
                    : 'Not specified',
                hasValue: property.floorNumber !== null && property.floorNumber !== undefined
            },
            totalFloors: {
                value: property.totalFloors,
                display: property.totalFloors ? `${property.totalFloors} Floors` : 'Not specified',
                hasValue: !!property.totalFloors
            },
            facingDirection: {
                value: property.facingDirection,
                display: property.facingDirection ? this._capitalizeFirst(property.facingDirection) : 'Not specified',
                hasValue: !!property.facingDirection
            },
            parking: {
                value: property.parking,
                display: property.parking ? this._capitalizeFirst(property.parking) : 'Not specified',
                hasValue: !!property.parking
            },
            propertyAge: {
                value: property.propertyAge,
                display: property.propertyAge ? property.propertyAge : 'Not specified',
                hasValue: !!property.propertyAge
            },
            // Room-specific fields
            roomType: {
                value: property.roomType,
                display: property.roomType ? this._capitalizeFirst(property.roomType) : 'Not specified',
                hasValue: !!property.roomType
            },
            bathroomType: {
                value: property.bathroomType,
                display: property.bathroomType ? this._capitalizeFirst(property.bathroomType) : 'Not specified',
                hasValue: !!property.bathroomType
            },
            kitchenAvailable: {
                value: property.kitchenAvailable,
                display: property.kitchenAvailable ? 'Available' : 'Not Available',
                hasValue: true // Always has a value (boolean)
            },
            // Commercial-specific fields
            washroom: {
                value: property.washroom,
                display: property.washroom || 'Not specified',
                hasValue: !!property.washroom
            },
            frontage: {
                value: property.frontage,
                display: property.frontage || 'Not specified',
                hasValue: !!property.frontage
            }
        };
    }

    /**
     * Transform financial data
     * @private
     */
    _transformFinancialData(property) {
        const monthlyRent = this.parseNumber(property.monthlyRent);
        const securityDeposit = this.parseNumber(property.securityDeposit);
        const maintenanceCharge = this.parseNumber(property.maintenanceCharge);
        const builtUpArea = this.parseNumber(property.builtUpArea);

        // Calculate derived values
        const totalMonthlyCost = monthlyRent + maintenanceCharge;
        const pricePerSqft = builtUpArea > 0 ? monthlyRent / builtUpArea : 0;

        return {
            monthlyRent: {
                value: monthlyRent,
                display: this.formatCurrency(monthlyRent),
                hasValue: monthlyRent > 0
            },
            securityDeposit: {
                value: securityDeposit,
                display: this.formatCurrency(securityDeposit),
                hasValue: securityDeposit > 0
            },
            maintenanceCharge: {
                value: maintenanceCharge,
                display: this.formatCurrency(maintenanceCharge),
                hasValue: maintenanceCharge > 0
            },
            totalMonthlyCost: {
                value: totalMonthlyCost,
                display: this.formatCurrency(totalMonthlyCost),
                hasValue: totalMonthlyCost > 0
            },
            pricePerSqft: {
                value: pricePerSqft,
                display: pricePerSqft > 0 ? `${this.formatCurrency(pricePerSqft)}/sqft per month` : 'Not calculated',
                hasValue: pricePerSqft > 0
            }
        };
    }

    /**
     * Transform amenities
     * @private
     */
    _transformAmenities(property) {
        if (!Array.isArray(property.amenities) || property.amenities.length === 0) {
            return {
                hasAmenities: false,
                count: 0,
                display: [],
                list: []
            };
        }

        const amenityIcons = {
            'parking': '🚗',
            'gym': '💪',
            'swimming pool': '🏊',
            'security': '🔒',
            'elevator': '🛗',
            'garden': '🌳',
            'playground': '🎮',
            'clubhouse': '🏛️',
            'water supply': '💧',
            'power backup': '⚡',
            'internet': '🌐',
            'cable tv': '📺'
        };

        const displayAmenities = property.amenities.map(amenity => {
            const lowerAmenity = amenity.toLowerCase();
            const icon = amenityIcons[lowerAmenity] || '✓';

            return {
                value: amenity,
                display: this._capitalizeFirst(amenity),
                icon: icon
            };
        });

        return {
            hasAmenities: true,
            count: property.amenities.length,
            display: displayAmenities,
            list: property.amenities
        };
    }

    /**
     * Transform dates
     * @private
     */
    _transformDates(property) {
        return {
            availableFrom: {
                value: property.availableFrom,
                display: property.availableFrom ? this._formatDate(property.availableFrom) : 'Not specified',
                hasValue: !!property.availableFrom
            },
            postedDate: {
                value: property.postedDate,
                display: property.postedDate ? this._formatDate(property.postedDate) : 'Not specified',
                hasValue: !!property.postedDate
            }
        };
    }

    /**
     * Transform location data
     * @private
     */
    _transformLocation(property) {
        return {
            address: {
                full: this._buildFullAddress(property.address),
                line: property.address?.line || 'Address not specified',
                city: property.address?.city || 'City not specified',
                pincode: property.address?.pincode || 'Pincode not specified'
            },
            coordinates: {
                lat: property.geolocation?.lat,
                lng: property.geolocation?.lng,
                hasCoordinates: !!(property.geolocation?.lat && property.geolocation?.lng)
            }
        };
    }

    /**
     * Capitalize first letter of string
     * @private
     */
    _capitalizeFirst(str) {
        if (!str || typeof str !== 'string') return 'Not specified';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Format date for display
     * @private
     */
    _formatDate(dateValue) {
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            // Format as MM/DD/YYYY or DD/MM/YYYY based on locale
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    /**
     * Build full address string
     * @private
     */
    _buildFullAddress(address) {
        if (!address) return 'Address not available';

        const parts = [
            address.line,
            address.city,
            address.pincode
        ].filter(part => part && part.trim());

        return parts.length > 0 ? parts.join(', ') : 'Address not available';
    }

    /**
     * Create fallback data for missing information
     * @param {string} type - Type of fallback data needed
     * @returns {*} Fallback data
     */
    createFallbackData(type) {
        const fallbacks = {
            description: 'A beautiful property with modern amenities.',
            amenities: ['Parking', 'Security', 'Water Supply', 'Power Backup'],
            monthlyRent: 0,
            securityDeposit: 0,
            maintenanceCharge: 0,
            bedrooms: 1,
            bathrooms: 1,
            builtUpArea: 1000
        };

        return fallbacks[type] || null;
    }
}