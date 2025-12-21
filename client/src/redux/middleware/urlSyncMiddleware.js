// URL synchronization middleware for bookmarkable searches and filters
const urlSyncMiddleware = (store) => (next) => (action) => {
    const result = next(action);

    // Only sync URL for filter-related actions
    if (action.type?.startsWith('filters/')) {
        const state = store.getState();
        const filters = state.filters;

        // Create URL params from filter state
        const urlParams = new URLSearchParams();

        // Add non-empty filter values to URL
        if (filters.propertyType) {
            urlParams.set('type', filters.propertyType);
        }

        if (filters.priceRange.min > 0 || filters.priceRange.max < filters.priceRangeLimits.max) {
            urlParams.set('minPrice', filters.priceRange.min.toString());
            urlParams.set('maxPrice', filters.priceRange.max.toString());
        }

        if (filters.bedrooms.length > 0) {
            urlParams.set('bedrooms', filters.bedrooms.join(','));
        }

        if (filters.amenities.length > 0) {
            urlParams.set('amenities', filters.amenities.join(','));
        }

        if (filters.furnishing.length > 0) {
            urlParams.set('furnishing', filters.furnishing.join(','));
        }

        if (filters.verifiedOnly) {
            urlParams.set('verified', 'true');
        }

        if (filters.location) {
            urlParams.set('location', filters.location);
        }

        if (filters.availableFrom) {
            urlParams.set('availableFrom', filters.availableFrom);
        }

        if (filters.sortBy !== 'relevance') {
            urlParams.set('sort', filters.sortBy);
        }

        if (filters.viewMode !== 'grid') {
            urlParams.set('view', filters.viewMode);
        }

        // Update URL without triggering page reload
        const newUrl = urlParams.toString() ?
            `${window.location.pathname}?${urlParams.toString()}` :
            window.location.pathname;

        window.history.replaceState({}, '', newUrl);
    }

    return result;
};

// Helper function to parse URL params and return filter state
export const parseUrlFilters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {};

    if (urlParams.has('type')) {
        filters.propertyType = urlParams.get('type');
    }

    if (urlParams.has('minPrice') || urlParams.has('maxPrice')) {
        filters.priceRange = {
            min: parseInt(urlParams.get('minPrice') || '0'),
            max: parseInt(urlParams.get('maxPrice') || '100000')
        };
    }

    if (urlParams.has('bedrooms')) {
        filters.bedrooms = urlParams.get('bedrooms').split(',').map(Number);
    }

    if (urlParams.has('amenities')) {
        filters.amenities = urlParams.get('amenities').split(',');
    }

    if (urlParams.has('furnishing')) {
        filters.furnishing = urlParams.get('furnishing').split(',');
    }

    if (urlParams.has('verified')) {
        filters.verifiedOnly = urlParams.get('verified') === 'true';
    }

    if (urlParams.has('location')) {
        filters.location = urlParams.get('location');
    }

    if (urlParams.has('availableFrom')) {
        filters.availableFrom = urlParams.get('availableFrom');
    }

    if (urlParams.has('sort')) {
        filters.sortBy = urlParams.get('sort');
    }

    if (urlParams.has('view')) {
        filters.viewMode = urlParams.get('view');
    }

    return filters;
};

export default urlSyncMiddleware;