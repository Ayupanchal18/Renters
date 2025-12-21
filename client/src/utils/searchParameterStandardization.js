/**
 * Search Parameter Standardization Utilities
 * 
 * This module provides consistent search parameter handling across all search interfaces.
 * It standardizes search payload structure, validation, and parameter mapping.
 */

import { normalizePropertyType } from './propertyTypeStandardization';
import { validateLocationInput, normalizeLocationData } from './locationStandardization';

// Standard search parameter structure
export const STANDARD_SEARCH_STRUCTURE = {
    location: {
        city: '',
        state: '',
        formatted: '',
        coordinates: { lat: null, lng: null }
    },
    propertyType: '',
    keywords: '',
    filters: {
        priceRange: { min: 0, max: 100000 },
        bedrooms: [],
        amenities: [],
        furnishing: [],
        verifiedOnly: false
    },
    pagination: {
        page: 1,
        limit: 20
    },
    sort: 'relevance'
};

// Search parameter validation rules
export const SEARCH_VALIDATION_RULES = {
    location: {
        required: true,
        minLength: 2,
        maxLength: 100
    },
    propertyType: {
        required: false,
        allowedValues: ['apartment', 'house', 'room', 'studio', 'pg', 'shared']
    },
    keywords: {
        required: true,
        minLength: 2,
        maxLength: 200
    },
    priceRange: {
        min: { min: 0, max: 50000 },
        max: { min: 0, max: 100000 }
    },
    bedrooms: {
        allowedValues: ['1', '2', '3', '4', '5+']
    },
    amenities: {
        maxItems: 10
    },
    pagination: {
        page: { min: 1, max: 1000 },
        limit: { min: 1, max: 100 }
    }
};

// Error messages for validation
export const VALIDATION_ERROR_MESSAGES = {
    location: {
        required: 'Location is required',
        minLength: 'Location must be at least 2 characters',
        maxLength: 'Location must be less than 100 characters',
        invalid: 'Location contains invalid characters'
    },
    propertyType: {
        invalid: 'Invalid property type selected'
    },
    keywords: {
        required: 'Search keywords are required',
        minLength: 'Keywords must be at least 2 characters',
        maxLength: 'Keywords must be less than 200 characters',
        invalid: 'Keywords contain invalid characters'
    },
    priceRange: {
        invalid: 'Invalid price range',
        minTooLow: 'Minimum price cannot be negative',
        maxTooHigh: 'Maximum price is too high',
        minGreaterThanMax: 'Minimum price cannot be greater than maximum price'
    },
    bedrooms: {
        invalid: 'Invalid bedroom selection'
    },
    amenities: {
        tooMany: 'Too many amenities selected (maximum 10)'
    },
    pagination: {
        invalidPage: 'Invalid page number',
        invalidLimit: 'Invalid page size'
    }
};

/**
 * Validates search parameters according to standardized rules
 * @param {Object} searchParams - Search parameters to validate
 * @returns {Object} - Validation result with errors and normalized data
 */
export function validateSearchParameters(searchParams) {
    const errors = {};
    const warnings = [];
    let isValid = true;

    if (!searchParams || typeof searchParams !== 'object') {
        return {
            isValid: false,
            errors: { general: 'Search parameters must be an object' },
            warnings: [],
            normalized: null
        };
    }

    // Validate location
    if (searchParams.location !== undefined) {
        const locationStr = typeof searchParams.location === 'string'
            ? searchParams.location
            : searchParams.location?.formatted || '';

        const locationValidation = validateLocationInput(locationStr);
        if (!locationValidation.isValid) {
            errors.location = locationValidation.error;
            isValid = false;
        }
    } else if (SEARCH_VALIDATION_RULES.location.required) {
        errors.location = VALIDATION_ERROR_MESSAGES.location.required;
        isValid = false;
    }

    // Validate property type
    if (searchParams.propertyType || searchParams.type) {
        const propertyType = searchParams.propertyType || searchParams.type;
        const normalizedType = normalizePropertyType(propertyType, 'filter');

        if (!normalizedType && propertyType.trim() !== '') {
            errors.propertyType = VALIDATION_ERROR_MESSAGES.propertyType.invalid;
            isValid = false;
        }
    }

    // Validate keywords/query
    const keywords = searchParams.keywords || searchParams.query || '';
    if (keywords) {
        if (typeof keywords !== 'string') {
            errors.keywords = VALIDATION_ERROR_MESSAGES.keywords.invalid;
            isValid = false;
        } else {
            const trimmed = keywords.trim();
            if (trimmed.length < SEARCH_VALIDATION_RULES.keywords.minLength) {
                errors.keywords = VALIDATION_ERROR_MESSAGES.keywords.minLength;
                isValid = false;
            } else if (trimmed.length > SEARCH_VALIDATION_RULES.keywords.maxLength) {
                errors.keywords = VALIDATION_ERROR_MESSAGES.keywords.maxLength;
                isValid = false;
            }

            // Check for harmful patterns
            const harmfulPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
            if (harmfulPatterns.some(pattern => pattern.test(trimmed))) {
                errors.keywords = VALIDATION_ERROR_MESSAGES.keywords.invalid;
                isValid = false;
            }
        }
    } else if (SEARCH_VALIDATION_RULES.keywords.required) {
        errors.keywords = VALIDATION_ERROR_MESSAGES.keywords.required;
        isValid = false;
    }

    // Validate filters if present
    if (searchParams.filters) {
        const filterValidation = validateFilters(searchParams.filters);
        if (!filterValidation.isValid) {
            Object.assign(errors, filterValidation.errors);
            isValid = false;
        }
        warnings.push(...filterValidation.warnings);
    }

    // Validate pagination if present
    if (searchParams.pagination) {
        const paginationValidation = validatePagination(searchParams.pagination);
        if (!paginationValidation.isValid) {
            Object.assign(errors, paginationValidation.errors);
            isValid = false;
        }
    }

    return {
        isValid,
        errors,
        warnings,
        normalized: isValid ? normalizeSearchParameters(searchParams) : null
    };
}

/**
 * Validates filter parameters
 * @param {Object} filters - Filter parameters
 * @returns {Object} - Validation result
 */
function validateFilters(filters) {
    const errors = {};
    const warnings = [];
    let isValid = true;

    if (!filters || typeof filters !== 'object') {
        return { isValid: true, errors: {}, warnings: [] };
    }

    // Validate price range
    if (filters.priceRange) {
        const { min, max } = filters.priceRange;

        if (min !== undefined && (typeof min !== 'number' || min < 0)) {
            errors.priceRange = VALIDATION_ERROR_MESSAGES.priceRange.minTooLow;
            isValid = false;
        }

        if (max !== undefined && (typeof max !== 'number' || max > SEARCH_VALIDATION_RULES.priceRange.max.max)) {
            errors.priceRange = VALIDATION_ERROR_MESSAGES.priceRange.maxTooHigh;
            isValid = false;
        }

        if (min !== undefined && max !== undefined && min > max) {
            errors.priceRange = VALIDATION_ERROR_MESSAGES.priceRange.minGreaterThanMax;
            isValid = false;
        }
    }

    // Validate bedrooms
    if (filters.bedrooms && Array.isArray(filters.bedrooms)) {
        const invalidBedrooms = filters.bedrooms.filter(
            bed => !SEARCH_VALIDATION_RULES.bedrooms.allowedValues.includes(bed)
        );

        if (invalidBedrooms.length > 0) {
            errors.bedrooms = VALIDATION_ERROR_MESSAGES.bedrooms.invalid;
            isValid = false;
        }
    }

    // Validate amenities
    if (filters.amenities && Array.isArray(filters.amenities)) {
        if (filters.amenities.length > SEARCH_VALIDATION_RULES.amenities.maxItems) {
            errors.amenities = VALIDATION_ERROR_MESSAGES.amenities.tooMany;
            isValid = false;
        }
    }

    return { isValid, errors, warnings };
}

/**
 * Validates pagination parameters
 * @param {Object} pagination - Pagination parameters
 * @returns {Object} - Validation result
 */
function validatePagination(pagination) {
    const errors = {};
    let isValid = true;

    if (!pagination || typeof pagination !== 'object') {
        return { isValid: true, errors: {} };
    }

    const { page, limit } = pagination;

    if (page !== undefined) {
        if (typeof page !== 'number' || page < SEARCH_VALIDATION_RULES.pagination.page.min ||
            page > SEARCH_VALIDATION_RULES.pagination.page.max) {
            errors.pagination = VALIDATION_ERROR_MESSAGES.pagination.invalidPage;
            isValid = false;
        }
    }

    if (limit !== undefined) {
        if (typeof limit !== 'number' || limit < SEARCH_VALIDATION_RULES.pagination.limit.min ||
            limit > SEARCH_VALIDATION_RULES.pagination.limit.max) {
            errors.pagination = VALIDATION_ERROR_MESSAGES.pagination.invalidLimit;
            isValid = false;
        }
    }

    return { isValid, errors };
}

/**
 * Normalizes search parameters to standard structure
 * @param {Object} searchParams - Raw search parameters
 * @returns {Object} - Normalized search parameters
 */
export function normalizeSearchParameters(searchParams) {
    if (!searchParams || typeof searchParams !== 'object') {
        return { ...STANDARD_SEARCH_STRUCTURE };
    }

    // Normalize location
    let location = { ...STANDARD_SEARCH_STRUCTURE.location };
    if (searchParams.location) {
        if (typeof searchParams.location === 'string') {
            location = normalizeLocationData(searchParams.location);
        } else if (typeof searchParams.location === 'object') {
            location = normalizeLocationData(searchParams.location);
        }
    }

    // Normalize property type
    let propertyType = '';
    if (searchParams.propertyType || searchParams.type) {
        const rawType = searchParams.propertyType || searchParams.type;
        // Determine source based on the type value to use correct mapping
        const source = ['1rk', '1bhk', 'pg', 'shared'].includes(rawType) ? 'homepage' : 'filter';
        propertyType = normalizePropertyType(rawType, source) || '';
    }

    // Normalize keywords
    const keywords = (searchParams.keywords || searchParams.query || '').toString().trim();

    // Normalize filters
    const filters = {
        ...STANDARD_SEARCH_STRUCTURE.filters,
        ...(searchParams.filters || {})
    };

    // Ensure filter arrays are arrays
    if (!Array.isArray(filters.bedrooms)) {
        filters.bedrooms = [];
    }
    if (!Array.isArray(filters.amenities)) {
        filters.amenities = [];
    }
    if (!Array.isArray(filters.furnishing)) {
        filters.furnishing = [];
    }

    // Normalize pagination
    const pagination = {
        page: searchParams.pagination?.page || STANDARD_SEARCH_STRUCTURE.pagination.page,
        limit: searchParams.pagination?.limit || STANDARD_SEARCH_STRUCTURE.pagination.limit
    };

    // Normalize sort
    const sort = searchParams.sort || STANDARD_SEARCH_STRUCTURE.sort;

    return {
        location,
        propertyType,
        keywords,
        filters,
        pagination,
        sort
    };
}

/**
 * Converts legacy search parameters to standard format
 * @param {Object} legacyParams - Legacy search parameters (from homepage or old format)
 * @returns {Object} - Standardized search parameters
 */
export function convertLegacySearchParams(legacyParams) {
    if (!legacyParams || typeof legacyParams !== 'object') {
        return { ...STANDARD_SEARCH_STRUCTURE };
    }

    // Handle different legacy formats
    const standardParams = {
        location: legacyParams.location || '',
        propertyType: legacyParams.type || legacyParams.propertyType || '',
        keywords: legacyParams.query || legacyParams.keywords || '',
        filters: legacyParams.filters || {},
        pagination: legacyParams.pagination || {},
        sort: legacyParams.sort || 'relevance'
    };

    return normalizeSearchParameters(standardParams);
}

/**
 * Converts standard search parameters to API payload format
 * @param {Object} standardParams - Standardized search parameters
 * @returns {Object} - API-ready payload
 */
export function convertToApiPayload(standardParams) {
    if (!standardParams || typeof standardParams !== 'object') {
        return {};
    }

    return {
        location: standardParams.location?.formatted || '',
        type: standardParams.propertyType || '',
        query: standardParams.keywords || '',
        filters: standardParams.filters || {},
        page: standardParams.pagination?.page || 1,
        limit: standardParams.pagination?.limit || 20,
        sort: standardParams.sort || 'relevance'
    };
}

/**
 * Converts standard search parameters to URL query string
 * @param {Object} standardParams - Standardized search parameters
 * @returns {string} - URL query string
 */
export function convertToUrlParams(standardParams) {
    if (!standardParams || typeof standardParams !== 'object') {
        return '';
    }

    const params = new URLSearchParams();

    // Add basic search parameters
    if (standardParams.location?.formatted) {
        params.set('location', standardParams.location.formatted);
    }
    if (standardParams.propertyType) {
        params.set('type', standardParams.propertyType);
    }
    if (standardParams.keywords) {
        params.set('q', standardParams.keywords);
    }

    // Add filters
    if (standardParams.filters) {
        const { priceRange, bedrooms, amenities, furnishing, verifiedOnly } = standardParams.filters;

        if (priceRange?.min > 0) {
            params.set('minPrice', priceRange.min.toString());
        }
        if (priceRange?.max < 100000) {
            params.set('maxPrice', priceRange.max.toString());
        }
        if (bedrooms?.length > 0) {
            params.set('bedrooms', bedrooms.join(','));
        }
        if (amenities?.length > 0) {
            params.set('amenities', amenities.join(','));
        }
        if (furnishing?.length > 0) {
            params.set('furnishing', furnishing.join(','));
        }
        if (verifiedOnly) {
            params.set('verified', 'true');
        }
    }

    // Add pagination and sort
    if (standardParams.pagination?.page > 1) {
        params.set('page', standardParams.pagination.page.toString());
    }
    if (standardParams.pagination?.limit !== 20) {
        params.set('limit', standardParams.pagination.limit.toString());
    }
    if (standardParams.sort !== 'relevance') {
        params.set('sort', standardParams.sort);
    }

    return params.toString();
}

/**
 * Parses URL query string to standard search parameters
 * @param {string} queryString - URL query string
 * @returns {Object} - Standardized search parameters
 */
export function parseUrlParams(queryString) {
    const params = new URLSearchParams(queryString);

    const searchParams = {
        location: params.get('location') || '',
        propertyType: params.get('type') || '',
        keywords: params.get('q') || '',
        filters: {
            priceRange: {
                min: parseInt(params.get('minPrice')) || 0,
                max: parseInt(params.get('maxPrice')) || 100000
            },
            bedrooms: params.get('bedrooms') ? params.get('bedrooms').split(',') : [],
            amenities: params.get('amenities') ? params.get('amenities').split(',') : [],
            furnishing: params.get('furnishing') ? params.get('furnishing').split(',') : [],
            verifiedOnly: params.get('verified') === 'true'
        },
        pagination: {
            page: parseInt(params.get('page')) || 1,
            limit: parseInt(params.get('limit')) || 20
        },
        sort: params.get('sort') || 'relevance'
    };

    return normalizeSearchParameters(searchParams);
}

/**
 * Compares two search parameter objects for equality
 * @param {Object} params1 - First search parameters
 * @param {Object} params2 - Second search parameters
 * @returns {boolean} - Whether parameters are equal
 */
export function areSearchParametersEqual(params1, params2) {
    if (!params1 && !params2) return true;
    if (!params1 || !params2) return false;

    const normalized1 = normalizeSearchParameters(params1);
    const normalized2 = normalizeSearchParameters(params2);

    // Compare key fields individually to handle object differences
    const location1 = normalized1.location?.formatted || '';
    const location2 = normalized2.location?.formatted || '';

    return (
        location1 === location2 &&
        normalized1.propertyType === normalized2.propertyType &&
        normalized1.keywords === normalized2.keywords &&
        JSON.stringify(normalized1.filters) === JSON.stringify(normalized2.filters) &&
        JSON.stringify(normalized1.pagination) === JSON.stringify(normalized2.pagination) &&
        normalized1.sort === normalized2.sort
    );
}

// Export all functions and constants
export default {
    STANDARD_SEARCH_STRUCTURE,
    SEARCH_VALIDATION_RULES,
    VALIDATION_ERROR_MESSAGES,
    validateSearchParameters,
    normalizeSearchParameters,
    convertLegacySearchParams,
    convertToApiPayload,
    convertToUrlParams,
    parseUrlParams,
    areSearchParametersEqual
};