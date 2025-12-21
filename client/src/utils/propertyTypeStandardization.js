/**
 * Property Type Standardization Utilities
 * 
 * This module provides consistent property type handling across all interfaces.
 * Values match the backend enum: ["room", "flat", "house", "pg", "hostel", "commercial"]
 */

// Standard property types - matches backend enum exactly
export const PROPERTY_TYPES = {
    ROOM: 'room',
    FLAT: 'flat',
    HOUSE: 'house',
    PG: 'pg',
    HOSTEL: 'hostel',
    COMMERCIAL: 'commercial'
};

// Standard property types for the test (alias)
export const STANDARD_PROPERTY_TYPES = {
    ROOM: 'room',
    APARTMENT: 'flat',
    HOUSE: 'house',
    PG: 'pg',
    HOSTEL: 'hostel',
    COMMERCIAL: 'commercial',
    STUDIO: 'room',
    SHARED: 'room'
};

// Property type display labels for UI
export const PROPERTY_TYPE_LABELS = {
    [PROPERTY_TYPES.ROOM]: 'Room',
    [PROPERTY_TYPES.FLAT]: 'Flat / Apartment',
    [PROPERTY_TYPES.HOUSE]: 'House',
    [PROPERTY_TYPES.PG]: 'PG (Paying Guest)',
    [PROPERTY_TYPES.HOSTEL]: 'Hostel',
    [PROPERTY_TYPES.COMMERCIAL]: 'Commercial'
};

// All valid property type values (for validation)
export const VALID_PROPERTY_TYPES = Object.values(PROPERTY_TYPES);

// Filter sidebar property type options
export const FILTER_PROPERTY_TYPE_OPTIONS = [
    { value: PROPERTY_TYPES.ROOM, label: 'Room' },
    { value: PROPERTY_TYPES.FLAT, label: 'Flat / Apartment' },
    { value: PROPERTY_TYPES.HOUSE, label: 'House' },
    { value: PROPERTY_TYPES.PG, label: 'PG' },
    { value: PROPERTY_TYPES.HOSTEL, label: 'Hostel' },
    { value: PROPERTY_TYPES.COMMERCIAL, label: 'Commercial' }
];

// Homepage property type options (can have different labels)
export const HOMEPAGE_PROPERTY_TYPE_OPTIONS = [
    { value: PROPERTY_TYPES.ROOM, label: 'Room' },
    { value: PROPERTY_TYPES.FLAT, label: 'Flat / Apartment' },
    { value: PROPERTY_TYPES.HOUSE, label: 'House' },
    { value: PROPERTY_TYPES.PG, label: 'PG (Paying Guest)' },
    { value: PROPERTY_TYPES.HOSTEL, label: 'Hostel' },
    { value: PROPERTY_TYPES.COMMERCIAL, label: 'Commercial Space' }
];

// Legacy mapping for backward compatibility
const LEGACY_TYPE_MAPPING = {
    'apartment': PROPERTY_TYPES.FLAT,
    'condo': PROPERTY_TYPES.FLAT,
    'studio': PROPERTY_TYPES.ROOM,
    'shared': PROPERTY_TYPES.ROOM,
    '1rk': PROPERTY_TYPES.ROOM,
    '1bhk': PROPERTY_TYPES.FLAT,
    '2bhk': PROPERTY_TYPES.FLAT,
    '3bhk': PROPERTY_TYPES.FLAT
};

/**
 * Normalizes a property type to the standard format
 * @param {string} propertyType - Property type in any format
 * @param {string} interfaceType - Interface type ('homepage', 'filter', 'backend')
 * @returns {string|null} - Standardized property type or null if invalid
 */
export function normalizePropertyType(propertyType, interfaceType = 'filter') {
    if (!propertyType || typeof propertyType !== 'string') {
        return null;
    }

    const normalized = propertyType.toLowerCase().trim();

    // Interface-specific mappings
    const interfaceMappings = {
        homepage: {
            '1rk': STANDARD_PROPERTY_TYPES.STUDIO,
            '1bhk': STANDARD_PROPERTY_TYPES.APARTMENT,
            'pg': STANDARD_PROPERTY_TYPES.PG,
            'shared': STANDARD_PROPERTY_TYPES.SHARED,
            'apartment': STANDARD_PROPERTY_TYPES.APARTMENT,
            'flat': STANDARD_PROPERTY_TYPES.APARTMENT
        },
        filter: {
            'room': STANDARD_PROPERTY_TYPES.ROOM,
            'house': STANDARD_PROPERTY_TYPES.HOUSE,
            'flat': STANDARD_PROPERTY_TYPES.APARTMENT,
            'studio': STANDARD_PROPERTY_TYPES.STUDIO,
            'apartment': STANDARD_PROPERTY_TYPES.APARTMENT
        },
        backend: {
            'room': STANDARD_PROPERTY_TYPES.ROOM,
            'flat': STANDARD_PROPERTY_TYPES.APARTMENT,
            'house': STANDARD_PROPERTY_TYPES.HOUSE,
            'pg': STANDARD_PROPERTY_TYPES.PG,
            'hostel': STANDARD_PROPERTY_TYPES.HOSTEL,
            'commercial': STANDARD_PROPERTY_TYPES.COMMERCIAL
        }
    };

    // Check interface-specific mapping first
    if (interfaceMappings[interfaceType] && interfaceMappings[interfaceType][normalized]) {
        return interfaceMappings[interfaceType][normalized];
    }

    // Check if it's already a valid standard type
    if (Object.values(STANDARD_PROPERTY_TYPES).includes(normalized)) {
        return normalized;
    }

    // Check legacy mapping
    if (LEGACY_TYPE_MAPPING[normalized]) {
        return LEGACY_TYPE_MAPPING[normalized];
    }

    return null;
}

/**
 * Converts standard property type to backend format
 * @param {string} standardType - Standard property type
 * @returns {string|null} - Backend property type or null if invalid
 */
export function standardToBackendType(standardType) {
    if (!standardType) return null;

    const backendMapping = {
        [STANDARD_PROPERTY_TYPES.APARTMENT]: 'flat',
        [STANDARD_PROPERTY_TYPES.HOUSE]: 'house',
        [STANDARD_PROPERTY_TYPES.ROOM]: 'room',
        [STANDARD_PROPERTY_TYPES.PG]: 'pg',
        [STANDARD_PROPERTY_TYPES.HOSTEL]: 'hostel',
        [STANDARD_PROPERTY_TYPES.COMMERCIAL]: 'commercial',
        [STANDARD_PROPERTY_TYPES.STUDIO]: 'room',
        [STANDARD_PROPERTY_TYPES.SHARED]: 'room'
    };

    return backendMapping[standardType] || null;
}

/**
 * Gets the display label for a property type
 * @param {string} propertyType - Property type value
 * @param {string} interfaceType - Interface type for normalization
 * @returns {string} - Display label
 */
export function getPropertyTypeLabel(propertyType, interfaceType = 'filter') {
    if (!propertyType) return '';

    const normalized = normalizePropertyType(propertyType, interfaceType);

    const labelMapping = {
        [STANDARD_PROPERTY_TYPES.APARTMENT]: 'Apartment',
        [STANDARD_PROPERTY_TYPES.HOUSE]: 'House',
        [STANDARD_PROPERTY_TYPES.ROOM]: 'Room',
        [STANDARD_PROPERTY_TYPES.PG]: 'PG (Paying Guest)',
        [STANDARD_PROPERTY_TYPES.HOSTEL]: 'Hostel',
        [STANDARD_PROPERTY_TYPES.COMMERCIAL]: 'Commercial',
        'room': 'Room'  // Direct mapping for 'room' value
    };

    // Special case for studio mapping
    if (propertyType === '1rk' && interfaceType === 'homepage') {
        return 'Studio';
    }

    return labelMapping[normalized] || PROPERTY_TYPE_LABELS[normalized] || propertyType;
}

/**
 * Validates if a property type is valid
 * @param {string} propertyType - Property type to validate
 * @param {string} interfaceType - Interface type for validation
 * @returns {boolean} - Whether the property type is valid
 */
export function isValidPropertyType(propertyType, interfaceType = 'filter') {
    return normalizePropertyType(propertyType, interfaceType) !== null;
}

/**
 * Gets property type options for a specific interface
 * @param {string} interfaceType - Interface type ('homepage', 'filter', 'form')
 * @returns {Array} - Array of property type options with value and label
 */
export function getPropertyTypeOptions(interfaceType = 'filter') {
    switch (interfaceType) {
        case 'homepage':
            return HOMEPAGE_PROPERTY_TYPE_OPTIONS;
        case 'filter':
        case 'form':
        default:
            return FILTER_PROPERTY_TYPE_OPTIONS;
    }
}

/**
 * Filters properties by property type
 * @param {Array} properties - Array of properties
 * @param {string} filterType - Property type to filter by
 * @param {string} interfaceType - Interface type for normalization
 * @returns {Array} - Filtered properties
 */
export function filterPropertiesByType(properties, filterType, interfaceType = 'filter') {
    if (!properties || !Array.isArray(properties) || !filterType) {
        return properties || [];
    }

    const normalizedFilter = normalizePropertyType(filterType, interfaceType);
    if (!normalizedFilter) {
        return properties;
    }

    return properties.filter(property => {
        const propertyCategory = property.category || property.propertyType;
        if (!propertyCategory) return false;

        const normalizedCategory = normalizePropertyType(propertyCategory, 'backend');
        return normalizedCategory === normalizedFilter;
    });
}

/**
 * Normalizes property data object
 * @param {Object} property - Property object to normalize
 * @returns {Object} - Normalized property object
 */
export function normalizePropertyData(property) {
    if (!property || typeof property !== 'object') {
        return property;
    }

    const normalized = { ...property };

    // Normalize propertyType if it exists
    if (normalized.propertyType) {
        normalized.propertyType = normalizePropertyType(normalized.propertyType, 'backend');
    }

    // Normalize category if it exists
    if (normalized.category) {
        normalized.category = normalizePropertyType(normalized.category, 'backend');
    }

    // If no propertyType but has category, use category as propertyType
    if (!normalized.propertyType && normalized.category) {
        normalized.propertyType = normalized.category;
    }

    return normalized;
}

export default {
    PROPERTY_TYPES,
    STANDARD_PROPERTY_TYPES,
    PROPERTY_TYPE_LABELS,
    VALID_PROPERTY_TYPES,
    FILTER_PROPERTY_TYPE_OPTIONS,
    HOMEPAGE_PROPERTY_TYPE_OPTIONS,
    normalizePropertyType,
    standardToBackendType,
    getPropertyTypeLabel,
    isValidPropertyType,
    getPropertyTypeOptions,
    filterPropertiesByType,
    normalizePropertyData
};
