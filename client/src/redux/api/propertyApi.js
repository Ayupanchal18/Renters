import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * RTK Query API for property data with caching
 * Validates: Requirements 6.3, 6.4
 */
export const propertyApi = createApi({
    reducerPath: 'propertyApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['Property', 'Search', 'Filter'],
    keepUnusedDataFor: 300, // Keep cached data for 5 minutes
    refetchOnMountOrArgChange: 600, // Refetch if data is older than 10 minutes
    endpoints: (builder) => ({
        // Get all properties with caching
        getProperties: builder.query({
            query: ({ page = 1, limit = 20, ...params } = {}) => ({
                url: '/properties',
                params: { page, limit, ...params },
            }),
            providesTags: (result) =>
                result?.items
                    ? [
                        ...result.items.map(({ _id }) => ({ type: 'Property', id: _id })),
                        { type: 'Property', id: 'LIST' },
                    ]
                    : [{ type: 'Property', id: 'LIST' }],
            // Transform response to normalize data structure
            transformResponse: (response) => ({
                items: response.items || response,
                totalCount: response.totalCount || response.length,
                currentPage: response.currentPage || 1,
                totalPages: response.totalPages || 1,
            }),
        }),

        // Search properties with caching
        searchProperties: builder.query({
            query: ({ query, location, filters = {}, page = 1, limit = 20 }) => ({
                url: '/properties/search',
                method: 'POST',
                body: {
                    query,
                    location,
                    filters,
                    page,
                    limit,
                },
            }),
            providesTags: ['Search'],
            // Keep search results cached for shorter time
            keepUnusedDataFor: 180, // 3 minutes for search results
        }),

        // Filter properties with caching
        filterProperties: builder.query({
            query: (filters) => ({
                url: '/properties/filter',
                method: 'POST',
                body: filters,
            }),
            providesTags: ['Filter'],
            keepUnusedDataFor: 240, // 4 minutes for filter results
        }),

        // Get single property with caching
        getProperty: builder.query({
            query: (id) => `/properties/${id}`,
            providesTags: (result, error, id) => [{ type: 'Property', id }],
        }),

        // Get user properties with caching
        getUserProperties: builder.query({
            query: (userId) => `/properties/user/${userId}`,
            providesTags: (result, error, userId) => [
                { type: 'Property', id: `USER_${userId}` },
            ],
        }),

        // Prefetch properties for performance
        prefetchProperties: builder.query({
            query: ({ startIndex = 0, count = 10 }) => ({
                url: '/properties',
                params: {
                    page: Math.floor(startIndex / count) + 1,
                    limit: count,
                },
            }),
            providesTags: ['Property'],
        }),
    }),
});

// Export hooks for use in components
export const {
    useGetPropertiesQuery,
    useSearchPropertiesQuery,
    useFilterPropertiesQuery,
    useGetPropertyQuery,
    useGetUserPropertiesQuery,
    usePrefetchPropertiesQuery,
    useLazyGetPropertiesQuery,
    useLazySearchPropertiesQuery,
    useLazyFilterPropertiesQuery,
} = propertyApi;

// Export utility functions
export const {
    util: { getRunningQueriesThunk },
} = propertyApi;

// Prefetch utilities
export const prefetchProperty = (id) =>
    propertyApi.util.prefetch('getProperty', id, { force: false });

export const prefetchProperties = (params = {}) =>
    propertyApi.util.prefetch('getProperties', params, { force: false });

export const prefetchUserProperties = (userId) =>
    propertyApi.util.prefetch('getUserProperties', userId, { force: false });

// Cache invalidation utilities
export const invalidatePropertyCache = () => (dispatch) => {
    dispatch(propertyApi.util.invalidateTags(['Property']));
};

export const invalidateSearchCache = () => (dispatch) => {
    dispatch(propertyApi.util.invalidateTags(['Search']));
};

export const invalidateFilterCache = () => (dispatch) => {
    dispatch(propertyApi.util.invalidateTags(['Filter']));
};

// Selective cache management
export const updatePropertyInCache = (propertyId, updates) => (dispatch, getState) => {
    dispatch(
        propertyApi.util.updateQueryData('getProperty', propertyId, (draft) => {
            Object.assign(draft, updates);
        })
    );

    // Also update in property lists
    dispatch(
        propertyApi.util.updateQueryData('getProperties', undefined, (draft) => {
            const property = draft.items?.find(p => p._id === propertyId);
            if (property) {
                Object.assign(property, updates);
            }
        })
    );
};

export default propertyApi;