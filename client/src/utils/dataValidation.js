/**
 * Data validation and normalization utilities for property data
 * Validates: Requirements 5.1, 5.2, 5.3
 */

// Property data validation schema
export const PROPERTY_SCHEMA = {
    required: ['title', 'monthlyRent', 'category', 'city', 'address', 'ownerId'],
    optional: ['description', 'photos', 'amenities', 'bedrooms', 'bathrooms', 'builtUpArea'],
    numeric: ['monthlyRent', 'securityDeposit', 'maintenanceCharge', 'bedrooms', 'bathrooms', 'builtUpArea', 'views'],
    arrays: ['photos', 'amenities'],
    enums: {
        category: ['room', 'flat', 'house', 'pg', 'hostel', 'commercial'],
        furnishing: ['unfurnished', 'semi', 'fully'],
        status: ['active', 'inactive', 'blocked'],
        ownerType: ['owner', 'agent', 'builder']
    }
};

/**
 * Validates a property object against the schema
 * @param {Object} property - Property data to validate
 * @returns {Object} - { isValid: boolean, errors: string[], warnings: string[] }
 */
export function validateProperty(property) {
    const errors = [];
    const warnings = [];

    if (!property || typeof property !== 'object') {
        return { isValid: false, errors: ['Property data must be an object'], warnings: [] };
    }

    // Check required fields
    PROPERTY_SCHEMA.required.forEach(field => {
        if (!property[field] || (typeof property[field] === 'string' && property[field].trim() === '')) {
            errors.push(`Required field '${field}' is missing or empty`);
        }
    });

    // Validate numeric fields
    PROPERTY_SCHEMA.numeric.forEach(field => {
        if (property[field] !== undefined && property[field] !== null) {
            const num = Number(property[field]);
            if (isNaN(num) || num < 0) {
                errors.push(`Field '${field}' must be a non-negative number`);
            }
        }
    });

    // Validate array fields
    PROPERTY_SCHEMA.arrays.forEach(field => {
        if (property[field] !== undefined && !Array.isArray(property[field])) {
            errors.push(`Field '${field}' must be an array`);
        }
    });

    // Validate enum fields
    Object.entries(PROPERTY_SCHEMA.enums).forEach(([field, validValues]) => {
        if (property[field] && !validValues.includes(property[field])) {
            errors.push(`Field '${field}' must be one of: ${validValues.join(', ')}`);
        }
    });

    // Validate specific business rules
    if (property.monthlyRent && property.monthlyRent <= 0) {
        errors.push('Monthly rent must be greater than 0');
    }

    if (property.bedrooms && property.bedrooms > 20) {
        warnings.push('Unusually high number of bedrooms (>20)');
    }

    if (property.bathrooms && property.bathrooms > property.bedrooms * 2) {
        warnings.push('Unusually high bathroom to bedroom ratio');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Normalizes property data to ensure consistent format
 * @param {Object} property - Raw property data
 * @returns {Object} - Normalized property data
 */
export function normalizeProperty(property) {
    if (!property || typeof property !== 'object') {
        return null;
    }

    const normalized = { ...property };

    // Normalize strings - trim whitespace and handle empty strings
    const stringFields = ['title', 'description', 'city', 'address', 'ownerName', 'ownerPhone', 'ownerEmail'];
    stringFields.forEach(field => {
        if (normalized[field] !== null && normalized[field] !== undefined) {
            normalized[field] = String(normalized[field]).trim();
            if (normalized[field] === '') {
                normalized[field] = null;
            }
        }
    });

    // Normalize numeric fields
    PROPERTY_SCHEMA.numeric.forEach(field => {
        if (normalized[field] !== undefined && normalized[field] !== null) {
            const num = Number(normalized[field]);
            normalized[field] = isNaN(num) ? null : Math.max(0, num);
        }
    });

    // Normalize arrays
    PROPERTY_SCHEMA.arrays.forEach(field => {
        if (normalized[field]) {
            if (!Array.isArray(normalized[field])) {
                normalized[field] = [];
            } else {
                // Remove empty/null items and trim strings
                normalized[field] = normalized[field]
                    .filter(item => item !== null && item !== undefined && item !== '')
                    .map(item => typeof item === 'string' ? item.trim() : item)
                    .filter(item => item !== null && item !== undefined && item !== '');
            }
        } else {
            normalized[field] = [];
        }
    });

    // Normalize boolean fields
    const booleanFields = ['negotiable', 'kitchenAvailable', 'featured', 'isDeleted'];
    booleanFields.forEach(field => {
        if (normalized[field] !== undefined) {
            normalized[field] = Boolean(normalized[field]);
        }
    });

    // Normalize dates
    if (normalized.availableFrom) {
        const date = new Date(normalized.availableFrom);
        normalized.availableFrom = isNaN(date.getTime()) ? null : date.toISOString();
    }

    // Ensure default values for critical fields
    normalized.status = normalized.status || 'active';
    normalized.views = normalized.views || 0;
    normalized.favoritesCount = normalized.favoritesCount || 0;
    normalized.photos = normalized.photos || [];
    normalized.amenities = normalized.amenities || [];

    return normalized;
}

/**
 * Validates and normalizes property data in one step
 * @param {Object} property - Raw property data
 * @returns {Object} - { property: Object|null, validation: Object }
 */
export function validateAndNormalizeProperty(property) {
    const normalized = normalizeProperty(property);
    const validation = validateProperty(normalized);

    return {
        property: validation.isValid ? normalized : null,
        validation
    };
}

/**
 * Handles missing property information gracefully
 * @param {Object} property - Property data (potentially incomplete)
 * @returns {Object} - Property with fallback values
 */
export function handleMissingPropertyInfo(property) {
    if (!property || typeof property !== 'object' || Array.isArray(property)) {
        return null;
    }

    const handled = { ...property };

    // Handle missing images
    if (!handled.photos || !Array.isArray(handled.photos) || handled.photos.length === 0) {
        handled.photos = ['/property_image/placeholder.jpg'];
        handled._hasPlaceholderImage = true;
    } else {
        // Filter out null/undefined/empty values from photos array
        const validPhotos = handled.photos.filter(photo =>
            photo !== null && photo !== undefined && photo !== '' && typeof photo === 'string'
        );
        if (validPhotos.length === 0) {
            handled.photos = ['/property_image/placeholder.jpg'];
            handled._hasPlaceholderImage = true;
        } else {
            handled.photos = validPhotos;
        }
    }

    // Handle missing title
    if (!handled.title || (typeof handled.title === 'string' && handled.title.trim() === '')) {
        handled.title = `${handled.category || 'Property'} in ${handled.city || 'Unknown Location'}`;
        handled._hasGeneratedTitle = true;
    }

    // Handle missing description
    if (!handled.description) {
        handled.description = `${handled.propertyType || 'Property'} available for rent in ${handled.city || 'prime location'}.`;
        handled._hasGeneratedDescription = true;
    }

    // Handle missing owner information
    if (!handled.ownerName) {
        handled.ownerName = 'Property Owner';
        handled._hasPlaceholderOwner = true;
    }

    // Handle missing numeric values
    if ((handled.bedrooms === null || handled.bedrooms === undefined) && handled.category !== 'room') {
        handled.bedrooms = 1;
        handled._hasDefaultBedrooms = true;
    }

    if (handled.bathrooms === null || handled.bathrooms === undefined) {
        handled.bathrooms = 1;
        handled._hasDefaultBathrooms = true;
    }

    if (handled.builtUpArea === null || handled.builtUpArea === undefined) {
        handled.builtUpArea = 'Not specified';
        handled._hasDefaultArea = true;
    }

    // Handle missing address
    if (!handled.address) {
        handled.address = handled.city || 'Location not specified';
        handled._hasGeneratedAddress = true;
    }

    return handled;
}

/**
 * Validates property list data
 * @param {Array} properties - Array of property objects
 * @returns {Object} - { validProperties: Array, invalidProperties: Array, summary: Object }
 */
export function validatePropertyList(properties) {
    if (!Array.isArray(properties)) {
        return {
            validProperties: [],
            invalidProperties: [],
            summary: { total: 0, valid: 0, invalid: 0, errors: ['Input is not an array'] }
        };
    }

    const validProperties = [];
    const invalidProperties = [];
    const allErrors = [];

    properties.forEach((property, index) => {
        const result = validateAndNormalizeProperty(property);
        if (result.property) {
            validProperties.push(result.property);
        } else {
            invalidProperties.push({
                index,
                property,
                errors: result.validation.errors
            });
            allErrors.push(...result.validation.errors);
        }
    });

    return {
        validProperties,
        invalidProperties,
        summary: {
            total: properties.length,
            valid: validProperties.length,
            invalid: invalidProperties.length,
            errors: [...new Set(allErrors)] // Remove duplicates
        }
    };
}