/**
 * Filter State Synchronization Utilities
 * 
 * This module provides consistent filter state management across all components.
 * It ensures filter state is properly synchronized between homepage, listings, and navigation.
 */

import { normalizePropertyType } from './propertyTypeStandardization';
import { normalizeLocationData } from './locationStandardization';

// Standard filter state structure
export const STANDARD_FILTER_STATE = {
    propertyType: '',
    priceRange: { min: 0, max: 100000 },
    bedrooms: [],
    amenities: [],
    furnishing: [],
    verifiedOnly: false,
    location: '',
    availableFrom: null,
    searchQuery: '',
    sortBy: 'relevance',
    viewMode: 'grid',
    scrollPosition: 0
};

// Filter validation rules
export const FILTER_VALIDATION_RULES = {
    propertyType: {
        allowedValues: ['apartment', 'house', 'room', 'studio', 'pg', 'shared', '']
    },
    priceRange: {
        min: { min: 0, max: 50000 },
        max: { min: 0, max: 100000 }
    },
    bedrooms: {
        allowedValues: ['1', '2', '3', '4', '5+']
    },
    amenities: {
        maxItems: 10,
        commonAmenities: [
            'Furnished', 'Parking', 'Wifi', 'Pet-friendly', 'Gym', 'Pool',
            'Laundry', 'Air Conditioning', 'Balcony', 'Garden'
        ]
    },
    furnishing: {
        allowedValues: ['furnished', 'semi-furnished', 'unfurnished']
    },
    searchQuery: {
        maxLength: 200,
        minLength: 0
    },
    sortBy: {
        allowedValues: ['relevance', 'price-low', 'price-high', 'newest', 'oldest']
    },
    viewMode: {
        allowedValues: ['grid', 'list']
    }
};

/**
 * Validates filter state according to standardized rules
 * @param {Object} filterState - Filter state to validate
 * @returns {Object} - Validation result with errors and normalized data
 */
export function validateFilterState(filterState) {
    const errors = {};
    const warnings = [];
    let isValid = true;

    if (!filterState || typeof filterState !== 'object') {
        return {
            isValid: false,
            errors: { general: 'Filter state must be an object' },
            warnings: [],
            normalized: null
        };
    }

    // Validate property type
    if (filterState.propertyType !== undefined) {
        const normalizedType = normalizePropertyType(filterState.propertyType, 'filter');
        if (filterState.propertyType && !normalizedType) {
            errors.propertyType = 'Invalid property type';
            isValid = false;
        }
    }

    // Validate price range
    if (filterState.priceRange) {
        const { min, max } = filterState.priceRange;

        if (min !== undefined && (typeof min !== 'number' || min < 0)) {
            errors.priceRange = 'Invalid minimum price';
            isValid = false;
        }

        if (max !== undefined && (typeof max !== 'number' || max > 100000)) {
            errors.priceRange = 'Invalid maximum price';
            isValid = false;
        }

        if (min !== undefined && max !== undefined && min > max) {
            errors.priceRange = 'Minimum price cannot be greater than maximum price';
            isValid = false;
        }
    }

    // Validate bedrooms
    if (filterState.bedrooms && Array.isArray(filterState.bedrooms)) {
        const invalidBedrooms = filterState.bedrooms.filter(
            bed => !FILTER_VALIDATION_RULES.bedrooms.allowedValues.includes(bed)
        );

        if (invalidBedrooms.length > 0) {
            errors.bedrooms = 'Invalid bedroom selection';
            isValid = false;
        }
    }

    // Validate amenities
    if (filterState.amenities && Array.isArray(filterState.amenities)) {
        if (filterState.amenities.length > FILTER_VALIDATION_RULES.amenities.maxItems) {
            errors.amenities = 'Too many amenities selected';
            isValid = false;
        }
    }

    // Validate furnishing
    if (filterState.furnishing && Array.isArray(filterState.furnishing)) {
        const invalidFurnishing = filterState.furnishing.filter(
            furn => !FILTER_VALIDATION_RULES.furnishing.allowedValues.includes(furn)
        );

        if (invalidFurnishing.length > 0) {
            errors.furnishing = 'Invalid furnishing selection';
            isValid = false;
        }
    }

    // Validate sort by
    if (filterState.sortBy && !FILTER_VALIDATION_RULES.sortBy.allowedValues.includes(filterState.sortBy)) {
        errors.sortBy = 'Invalid sort option';
        isValid = false;
    }

    // Validate view mode
    if (filterState.viewMode && !FILTER_VALIDATION_RULES.viewMode.allowedValues.includes(filterState.viewMode)) {
        errors.viewMode = 'Invalid view mode';
        isValid = false;
    }

    return {
        isValid,
        errors,
        warnings,
        normalized: isValid ? normalizeFilterState(filterState) : null
    };
}

/**
 * Normalizes filter state to standard structure
 * @param {Object} filterState - Raw filter state
 * @returns {Object} - Normalized filter state
 */
export function normalizeFilterState(filterState) {
    if (!filterState || typeof filterState !== 'object') {
        return { ...STANDARD_FILTER_STATE };
    }

    // Normalize property type
    let propertyType = '';
    if (filterState.propertyType) {
        propertyType = normalizePropertyType(filterState.propertyType, 'filter') || '';
    }

    // Normalize price range
    const priceRange = {
        min: Math.max(0, filterState.priceRange?.min || 0),
        max: Math.min(100000, filterState.priceRange?.max || 100000)
    };

    // Ensure arrays are arrays and contain valid values
    const bedrooms = Array.isArray(filterState.bedrooms)
        ? filterState.bedrooms.filter(bed => FILTER_VALIDATION_RULES.bedrooms.allowedValues.includes(bed))
        : [];

    const amenities = Array.isArray(filterState.amenities)
        ? filterState.amenities.slice(0, FILTER_VALIDATION_RULES.amenities.maxItems)
        : [];

    const furnishing = Array.isArray(filterState.furnishing)
        ? filterState.furnishing.filter(furn => FILTER_VALIDATION_RULES.furnishing.allowedValues.includes(furn))
        : [];

    // Normalize boolean values
    const verifiedOnly = Boolean(filterState.verifiedOnly);

    // Normalize location
    const location = typeof filterState.location === 'string'
        ? filterState.location.trim()
        : '';

    // Normalize date
    const availableFrom = filterState.availableFrom
        ? new Date(filterState.availableFrom).toISOString().split('T')[0]
        : null;

    // Normalize search query
    const searchQuery = typeof filterState.searchQuery === 'string'
        ? filterState.searchQuery.trim().slice(0, FILTER_VALIDATION_RULES.searchQuery.maxLength)
        : '';

    // Normalize sort and view mode
    const sortBy = FILTER_VALIDATION_RULES.sortBy.allowedValues.includes(filterState.sortBy)
        ? filterState.sortBy
        : 'relevance';

    const viewMode = FILTER_VALIDATION_RULES.viewMode.allowedValues.includes(filterState.viewMode)
        ? filterState.viewMode
        : 'grid';

    // Normalize scroll position
    const scrollPosition = typeof filterState.scrollPosition === 'number'
        ? Math.max(0, filterState.scrollPosition)
        : 0;

    return {
        propertyType,
        priceRange,
        bedrooms,
        amenities,
        furnishing,
        verifiedOnly,
        location,
        availableFrom,
        searchQuery,
        sortBy,
        viewMode,
        scrollPosition
    };
}

/**
 * Merges filter states with priority (later states override earlier ones)
 * @param {...Object} filterStates - Filter states to merge
 * @returns {Object} - Merged filter state
 */
export function mergeFilterStates(...filterStates) {
    const validStates = filterStates.filter(state => state && typeof state === 'object');

    if (validStates.length === 0) {
        return { ...STANDARD_FILTER_STATE };
    }

    // Start with standard state and merge each state
    let merged = { ...STANDARD_FILTER_STATE };

    validStates.forEach(state => {
        // Merge primitive values
        Object.keys(state).forEach(key => {
            if (key === 'priceRange' && state[key]) {
                merged.priceRange = { ...merged.priceRange, ...state[key] };
            } else if (Array.isArray(state[key])) {
                merged[key] = [...state[key]];
            } else if (state[key] !== undefined && state[key] !== null) {
                merged[key] = state[key];
            }
        });
    });

    return normalizeFilterState(merged);
}

/**
 * Converts filter state to URL parameters
 * @param {Object} filterState - Filter state
 * @returns {string} - URL query string
 */
export function filterStateToUrlParams(filterState) {
    if (!filterState || typeof filterState !== 'object') {
        return '';
    }

    const params = new URLSearchParams();

    // Add basic filters
    if (filterState.propertyType) {
        params.set('type', filterState.propertyType);
    }

    if (filterState.priceRange) {
        if (filterState.priceRange.min > 0) {
            params.set('minPrice', filterState.priceRange.min.toString());
        }
        if (filterState.priceRange.max < 100000) {
            params.set('maxPrice', filterState.priceRange.max.toString());
        }
    }

    if (filterState.bedrooms && filterState.bedrooms.length > 0) {
        params.set('bedrooms', filterState.bedrooms.join(','));
    }

    if (filterState.amenities && filterState.amenities.length > 0) {
        params.set('amenities', filterState.amenities.join(','));
    }

    if (filterState.furnishing && filterState.furnishing.length > 0) {
        params.set('furnishing', filterState.furnishing.join(','));
    }

    if (filterState.verifiedOnly) {
        params.set('verified', 'true');
    }

    if (filterState.location) {
        params.set('location', filterState.location);
    }

    if (filterState.searchQuery) {
        params.set('q', filterState.searchQuery);
    }

    if (filterState.availableFrom) {
        params.set('availableFrom', filterState.availableFrom);
    }

    if (filterState.sortBy && filterState.sortBy !== 'relevance') {
        params.set('sort', filterState.sortBy);
    }

    if (filterState.viewMode && filterState.viewMode !== 'grid') {
        params.set('view', filterState.viewMode);
    }

    return params.toString();
}

/**
 * Parses URL parameters to filter state
 * @param {string} urlParams - URL query string
 * @returns {Object} - Filter state
 */
export function urlParamsToFilterState(urlParams) {
    const params = new URLSearchParams(urlParams);

    const filterState = {
        propertyType: params.get('type') || '',
        priceRange: {
            min: parseInt(params.get('minPrice')) || 0,
            max: parseInt(params.get('maxPrice')) || 100000
        },
        bedrooms: params.get('bedrooms') ? params.get('bedrooms').split(',') : [],
        amenities: params.get('amenities') ? params.get('amenities').split(',') : [],
        furnishing: params.get('furnishing') ? params.get('furnishing').split(',') : [],
        verifiedOnly: params.get('verified') === 'true',
        location: params.get('location') || '',
        searchQuery: params.get('q') || '',
        availableFrom: params.get('availableFrom') || null,
        sortBy: params.get('sort') || 'relevance',
        viewMode: params.get('view') || 'grid',
        scrollPosition: 0
    };

    return normalizeFilterState(filterState);
}

/**
 * Compares two filter states for equality
 * @param {Object} state1 - First filter state
 * @param {Object} state2 - Second filter state
 * @returns {boolean} - Whether states are equal
 */
export function areFilterStatesEqual(state1, state2) {
    if (!state1 && !state2) return true;
    if (!state1 || !state2) return false;

    const normalized1 = normalizeFilterState(state1);
    const normalized2 = normalizeFilterState(state2);

    // Compare all fields
    return (
        normalized1.propertyType === normalized2.propertyType &&
        normalized1.priceRange.min === normalized2.priceRange.min &&
        normalized1.priceRange.max === normalized2.priceRange.max &&
        JSON.stringify(normalized1.bedrooms.sort()) === JSON.stringify(normalized2.bedrooms.sort()) &&
        JSON.stringify(normalized1.amenities.sort()) === JSON.stringify(normalized2.amenities.sort()) &&
        JSON.stringify(normalized1.furnishing.sort()) === JSON.stringify(normalized2.furnishing.sort()) &&
        normalized1.verifiedOnly === normalized2.verifiedOnly &&
        normalized1.location === normalized2.location &&
        normalized1.availableFrom === normalized2.availableFrom &&
        normalized1.sortBy === normalized2.sortBy &&
        normalized1.viewMode === normalized2.viewMode
    );
}

/**
 * Creates a filter state from search parameters
 * @param {Object} searchParams - Search parameters
 * @returns {Object} - Filter state
 */
export function searchParamsToFilterState(searchParams) {
    if (!searchParams || typeof searchParams !== 'object') {
        return { ...STANDARD_FILTER_STATE };
    }

    const filterState = {
        propertyType: searchParams.propertyType || searchParams.type || '',
        location: searchParams.location?.formatted || searchParams.location || '',
        searchQuery: searchParams.query || searchParams.searchQuery || '',
        priceRange: searchParams.filters?.priceRange || { min: 0, max: 100000 },
        bedrooms: searchParams.filters?.bedrooms || [],
        amenities: searchParams.filters?.amenities || [],
        furnishing: searchParams.filters?.furnishing || [],
        verifiedOnly: searchParams.filters?.verifiedOnly || false,
        availableFrom: searchParams.filters?.availableFrom || null,
        sortBy: searchParams.sort || 'relevance',
        viewMode: 'grid',
        scrollPosition: 0
    };

    return normalizeFilterState(filterState);
}

/**
 * Gets the count of active filters
 * @param {Object} filterState - Filter state
 * @returns {number} - Number of active filters
 */
export function getActiveFilterCount(filterState) {
    if (!filterState || typeof filterState !== 'object') {
        return 0;
    }

    let count = 0;

    if (filterState.propertyType) count++;
    if (filterState.priceRange && (filterState.priceRange.min > 0 || filterState.priceRange.max < 100000)) count++;
    if (filterState.bedrooms && filterState.bedrooms.length > 0) count++;
    if (filterState.amenities && filterState.amenities.length > 0) count++;
    if (filterState.furnishing && filterState.furnishing.length > 0) count++;
    if (filterState.verifiedOnly) count++;
    if (filterState.location) count++;
    if (filterState.availableFrom) count++;

    return count;
}

/**
 * Clears all filters while preserving view state
 * @param {Object} filterState - Current filter state
 * @returns {Object} - Cleared filter state
 */
export function clearAllFilters(filterState) {
    const clearedState = { ...STANDARD_FILTER_STATE };

    // Preserve view state
    if (filterState) {
        clearedState.sortBy = filterState.sortBy || 'relevance';
        clearedState.viewMode = filterState.viewMode || 'grid';
        clearedState.scrollPosition = filterState.scrollPosition || 0;
    }

    return clearedState;
}

// Export all functions and constants
export default {
    STANDARD_FILTER_STATE,
    FILTER_VALIDATION_RULES,
    validateFilterState,
    normalizeFilterState,
    mergeFilterStates,
    filterStateToUrlParams,
    urlParamsToFilterState,
    areFilterStatesEqual,
    searchParamsToFilterState,
    getActiveFilterCount,
    clearAllFilters
};