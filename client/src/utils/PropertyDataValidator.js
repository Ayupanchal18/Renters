/**
 * Property Data Validator
 * 
 * Provides data validation and transformation for property information:
 * - Validates property data integrity
 * - Creates fallback data for missing information
 * - Transforms data for consistent display
 * - Handles error states gracefully
 */
export class PropertyDataValidator {
    constructor() {
        console.log('PropertyDataValidator initialized - v2');
        this.defaultValues = {
            bedrooms: 1,
            bathrooms: 1,
            builtUpArea: 1000,
            monthlyRent: 0,
            securityDeposit: 0,
            maintenanceCharge: 0,
            propertyType: 'Apartment',
            category: 'Residential',
            furnishing: 'Unfurnished',
            description: 'A beautiful property with modern amenities.',
            amenities: ['Parking', 'Security', 'Water Supply', 'Power Backup']
        };
    }

    /**
     * Validate and transform property data
     * @param {Object} property - Raw property data
     * @returns {Object} Validation result with transformed property
     */
    validateAndTransform(property) {
        if (!property) {
            return this.createEmptyPropertyWithFallbacks();
        }

        const result = {
            property: { ...property },
            hasWarnings: false,
            hasFallbacks: false,
            warnings: [],
            fallbacks: []
        };

        // Validate and apply fallbacks for missing data
        this._validateFinancialData(result);
        this._validateSpecifications(result);
        this._validateBasicInfo(result);
        this._validateAmenities(result);
        this._validateDates(result);

        return result;
    }

    /**
     * Create empty property with fallback values
     * @returns {Object} Property with fallback data
     */
    createEmptyPropertyWithFallbacks() {
        return {
            property: {
                ...this.defaultValues,
                _hasDefaultBedrooms: true,
                _hasDefaultBathrooms: true,
                _hasDefaultArea: true,
                _hasDefaultSecurityDeposit: true,
                _hasDefaultMaintenanceCharge: true,
                _hasGeneratedDescription: true,
                _hasDefaultAmenities: true
            },
            hasWarnings: false,
            hasFallbacks: true,
            warnings: [],
            fallbacks: ['Using default property information']
        };
    }

    /**
     * Validate financial data
     * @private
     */
    _validateFinancialData(result) {
        const { property } = result;

        // Monthly rent validation
        if (!this._isValidNumber(property.monthlyRent)) {
            if (property.monthlyRent === undefined || property.monthlyRent === null) {
                // Don't set default for rent - let it be handled by display logic
                result.warnings.push('Monthly rent not specified');
                result.hasWarnings = true;
            }
        }

        // Security deposit validation
        if (!this._isValidNumber(property.securityDeposit)) {
            property.securityDeposit = this.defaultValues.securityDeposit;
            property._hasDefaultSecurityDeposit = true;
            result.fallbacks.push('Using default security deposit');
            result.hasFallbacks = true;
        }

        // Maintenance charge validation
        if (!this._isValidNumber(property.maintenanceCharge)) {
            property.maintenanceCharge = this.defaultValues.maintenanceCharge;
            property._hasDefaultMaintenanceCharge = true;
            result.fallbacks.push('Using default maintenance charge');
            result.hasFallbacks = true;
        }
    }

    /**
     * Validate property specifications
     * @private
     */
    _validateSpecifications(result) {
        const { property } = result;

        // Bedrooms validation
        if (!this._isValidNumber(property.bedrooms) || property.bedrooms < 1) {
            property.bedrooms = this.defaultValues.bedrooms;
            property._hasDefaultBedrooms = true;
            result.fallbacks.push('Using default bedroom count');
            result.hasFallbacks = true;
        }

        // Bathrooms validation
        if (!this._isValidNumber(property.bathrooms) || property.bathrooms < 1) {
            property.bathrooms = this.defaultValues.bathrooms;
            property._hasDefaultBathrooms = true;
            result.fallbacks.push('Using default bathroom count');
            result.hasFallbacks = true;
        }

        // Built-up area validation
        if (!this._isValidNumber(property.builtUpArea) || property.builtUpArea < 100) {
            property.builtUpArea = this.defaultValues.builtUpArea;
            property._hasDefaultArea = true;
            result.fallbacks.push('Using default built-up area');
            result.hasFallbacks = true;
        }
    }

    /**
     * Validate basic property information
     * @private
     */
    _validateBasicInfo(result) {
        const { property } = result;

        // Property type validation
        if (!property.propertyType || typeof property.propertyType !== 'string') {
            property.propertyType = this.defaultValues.propertyType;
            result.fallbacks.push('Using default property type');
            result.hasFallbacks = true;
        }

        // Category validation
        if (!property.category || typeof property.category !== 'string') {
            property.category = this.defaultValues.category;
            result.fallbacks.push('Using default category');
            result.hasFallbacks = true;
        }

        // Furnishing validation
        if (!property.furnishing || typeof property.furnishing !== 'string') {
            property.furnishing = this.defaultValues.furnishing;
            result.fallbacks.push('Using default furnishing');
            result.hasFallbacks = true;
        }

        // Description validation
        if (!property.description || typeof property.description !== 'string' || property.description.trim().length < 10) {
            property.description = this.defaultValues.description;
            property._hasGeneratedDescription = true;
            result.fallbacks.push('Using generated description');
            result.hasFallbacks = true;
        }
    }

    /**
     * Validate amenities
     * @private
     */
    _validateAmenities(result) {
        const { property } = result;

        if (!Array.isArray(property.amenities) || property.amenities.length === 0) {
            property.amenities = [...this.defaultValues.amenities];
            property._hasDefaultAmenities = true;
            result.fallbacks.push('Using default amenities');
            result.hasFallbacks = true;
        }
    }

    /**
     * Validate dates
     * @private
     */
    _validateDates(result) {
        const { property } = result;

        // Available from date validation
        if (property.availableFrom) {
            const date = new Date(property.availableFrom);
            if (isNaN(date.getTime())) {
                result.warnings.push('Invalid available from date');
                result.hasWarnings = true;
                delete property.availableFrom;
            }
        }
    }

    /**
     * Check if a value is a valid number
     * @private
     */
    _isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0;
    }

    /**
     * Get validation summary
     * @param {Object} validationResult - Result from validateAndTransform
     * @returns {Object} Summary of validation
     */
    getValidationSummary(validationResult) {
        return {
            isValid: !validationResult.hasWarnings,
            hasIssues: validationResult.hasWarnings || validationResult.hasFallbacks,
            warningCount: validationResult.warnings.length,
            fallbackCount: validationResult.fallbacks.length,
            summary: validationResult.hasWarnings
                ? 'Property has validation warnings'
                : validationResult.hasFallbacks
                    ? 'Property using fallback data'
                    : 'Property data is complete'
        };
    }

    /**
     * validate phone number
     * @param {string} phone 
     * @returns {boolean}
     */
    isValidPhoneNumber(phone) {
        if (!phone) return false;
        // Basic validation: checks for 10-15 digits, allowing optional +, -, spaces, parentheses
        const phoneRegex = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;
        // Also allow simple 10 digit numbers
        const simplePhoneRegex = /^\d{10,15}$/;

        // Remove non-digit characters for simple check
        const digitsOnly = phone.replace(/\D/g, '');

        return phoneRegex.test(phone) || (digitsOnly.length >= 10 && digitsOnly.length <= 15);
    }

    /**
     * Validate email address
     * @param {string} email 
     * @returns {boolean}
     */
    isValidEmail(email) {
        if (!email) return false;
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Export singleton instance for convenience
export const propertyDataValidator = new PropertyDataValidator();