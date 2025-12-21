import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
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
} from './filterStateSynchronization';

describe('Filter State Synchronization', () => {
    describe('validateFilterState', () => {
        it('should validate valid filter state', () => {
            const validState = {
                propertyType: 'apartment',
                priceRange: { min: 1000, max: 3000 },
                bedrooms: ['2', '3'],
                amenities: ['parking', 'gym'],
                furnishing: ['furnished'],
                verifiedOnly: true,
                location: 'New York, NY',
                sortBy: 'price-low',
                viewMode: 'grid'
            };

            const result = validateFilterState(validState);

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
            expect(result.normalized).toBeTruthy();
        });

        it('should reject invalid filter state', () => {
            const invalidState = {
                propertyType: 'invalid-type',
                priceRange: { min: 5000, max: 2000 }, // min > max
                bedrooms: ['invalid-bedroom'],
                amenities: new Array(15).fill('amenity'), // Too many
                sortBy: 'invalid-sort',
                viewMode: 'invalid-view'
            };

            const result = validateFilterState(invalidState);

            expect(result.isValid).toBe(false);
            expect(result.errors.propertyType).toBeTruthy();
            expect(result.errors.priceRange).toBeTruthy();
            expect(result.errors.bedrooms).toBeTruthy();
            expect(result.errors.amenities).toBeTruthy();
            expect(result.errors.sortBy).toBeTruthy();
            expect(result.errors.viewMode).toBeTruthy();
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * Feature: property-listing-search-filter, Property 18: Filter State Synchronization
         * For any filter state change or navigation between views, 
         * the system should maintain consistent filter values and properly synchronize state across components
         * Validates: Requirements 10.1, 10.2, 10.3, 10.4
         */
        it('should maintain filter state consistency across operations', () => {
            fc.assert(fc.property(
                fc.record({
                    propertyType: fc.option(fc.constantFrom('apartment', 'house', 'room', 'studio')),
                    priceRange: fc.record({
                        min: fc.integer({ min: 0, max: 5000 }),
                        max: fc.integer({ min: 1000, max: 10000 })
                    }),
                    bedrooms: fc.array(fc.constantFrom('1', '2', '3', '4', '5+'), { maxLength: 3 }),
                    amenities: fc.array(fc.constantFrom('parking', 'gym', 'pool', 'wifi'), { maxLength: 5 }),
                    verifiedOnly: fc.boolean(),
                    sortBy: fc.constantFrom('relevance', 'price-low', 'price-high', 'newest'),
                    viewMode: fc.constantFrom('grid', 'list')
                }),
                (filterState) => {
                    // Normalize -> URL -> Parse should be consistent
                    const normalized1 = normalizeFilterState(filterState);
                    const urlParams = filterStateToUrlParams(normalized1);
                    const parsedFromUrl = urlParamsToFilterState(urlParams);
                    const normalized2 = normalizeFilterState(parsedFromUrl);

                    // Should maintain consistency through URL round-trip
                    expect(areFilterStatesEqual(normalized1, normalized2)).toBe(true);

                    // Should always return valid structure
                    expect(normalized1).toHaveProperty('propertyType');
                    expect(normalized1).toHaveProperty('priceRange');
                    expect(normalized1).toHaveProperty('bedrooms');
                    expect(normalized1).toHaveProperty('amenities');
                    expect(normalized1).toHaveProperty('viewMode');

                    // Arrays should remain arrays
                    expect(Array.isArray(normalized1.bedrooms)).toBe(true);
                    expect(Array.isArray(normalized1.amenities)).toBe(true);
                }
            ));
        });

        it('should handle filter state merging consistently', () => {
            fc.assert(fc.property(
                fc.array(fc.record({
                    propertyType: fc.option(fc.constantFrom('apartment', 'house', 'room')),
                    priceRange: fc.option(fc.record({
                        min: fc.integer({ min: 0, max: 3000 }),
                        max: fc.integer({ min: 2000, max: 8000 })
                    })),
                    bedrooms: fc.option(fc.array(fc.constantFrom('1', '2', '3'), { maxLength: 2 })),
                    verifiedOnly: fc.option(fc.boolean())
                }), { minLength: 1, maxLength: 4 }),
                (filterStates) => {
                    const merged = mergeFilterStates(...filterStates);

                    // Should always return valid structure
                    expect(merged).toHaveProperty('propertyType');
                    expect(merged).toHaveProperty('priceRange');
                    expect(merged).toHaveProperty('bedrooms');
                    expect(merged).toHaveProperty('amenities');

                    // Should be consistent
                    const merged2 = mergeFilterStates(...filterStates);
                    expect(areFilterStatesEqual(merged, merged2)).toBe(true);

                    // Should preserve array types
                    expect(Array.isArray(merged.bedrooms)).toBe(true);
                    expect(Array.isArray(merged.amenities)).toBe(true);
                }
            ));
        });

        it('should normalize filter states consistently', () => {
            fc.assert(fc.property(
                fc.record({
                    propertyType: fc.option(fc.string()),
                    priceRange: fc.option(fc.record({
                        min: fc.integer(),
                        max: fc.integer()
                    })),
                    bedrooms: fc.option(fc.array(fc.string())),
                    amenities: fc.option(fc.array(fc.string())),
                    verifiedOnly: fc.option(fc.boolean()),
                    location: fc.option(fc.string())
                }),
                (filterState) => {
                    // Skip dangerous property names that could cause prototype pollution
                    if (filterState.propertyType === '__proto__' ||
                        filterState.propertyType === 'constructor' ||
                        filterState.propertyType === 'prototype') {
                        return true; // Skip this test case
                    }

                    const normalized1 = normalizeFilterState(filterState);
                    const normalized2 = normalizeFilterState(filterState);

                    // Should be consistent
                    expect(normalized1).toEqual(normalized2);

                    // Should always return complete structure
                    Object.keys(STANDARD_FILTER_STATE).forEach(key => {
                        expect(normalized1).toHaveProperty(key);
                    });

                    // Should handle invalid values gracefully
                    expect(typeof normalized1.propertyType).toBe('string');
                    expect(typeof normalized1.priceRange).toBe('object');
                    expect(Array.isArray(normalized1.bedrooms)).toBe(true);
                    expect(Array.isArray(normalized1.amenities)).toBe(true);
                    expect(typeof normalized1.verifiedOnly).toBe('boolean');
                }
            ));
        });
    });

    describe('normalizeFilterState', () => {
        it('should normalize different filter state formats', () => {
            const rawState = {
                propertyType: 'flat', // Should remain 'flat' (backend format)
                priceRange: { min: -100, max: 200000 }, // Should be clamped
                bedrooms: ['1', '2', 'invalid'], // Should filter out invalid
                amenities: new Array(15).fill('gym'), // Should be limited
                verifiedOnly: 'true', // Should be converted to boolean
                location: '  New York  ', // Should be trimmed
                sortBy: 'invalid-sort', // Should default to 'relevance'
                viewMode: 'invalid-view' // Should default to 'grid'
            };

            const normalized = normalizeFilterState(rawState);

            expect(normalized.propertyType).toBe('flat'); // 'flat' is the correct backend format
            expect(normalized.priceRange.min).toBe(0);
            expect(normalized.priceRange.max).toBe(100000);
            expect(normalized.bedrooms).toEqual(['1', '2']);
            expect(normalized.amenities.length).toBeLessThanOrEqual(10);
            expect(normalized.verifiedOnly).toBe(true);
            expect(normalized.location).toBe('New York');
            expect(normalized.sortBy).toBe('relevance');
            expect(normalized.viewMode).toBe('grid');
        });

        it('should handle empty or invalid inputs', () => {
            expect(normalizeFilterState(null)).toEqual(STANDARD_FILTER_STATE);
            expect(normalizeFilterState({})).toMatchObject(STANDARD_FILTER_STATE);
            expect(normalizeFilterState('invalid')).toEqual(STANDARD_FILTER_STATE);
        });
    });

    describe('mergeFilterStates', () => {
        it('should merge multiple filter states correctly', () => {
            const state1 = {
                propertyType: 'apartment',
                priceRange: { min: 1000, max: 3000 },
                bedrooms: ['2']
            };

            const state2 = {
                propertyType: 'house', // Should override
                amenities: ['parking'],
                verifiedOnly: true
            };

            const state3 = {
                bedrooms: ['3', '4'], // Should override
                location: 'Boston, MA'
            };

            const merged = mergeFilterStates(state1, state2, state3);

            expect(merged.propertyType).toBe('house'); // From state2
            expect(merged.priceRange).toEqual({ min: 1000, max: 3000 }); // From state1
            expect(merged.bedrooms).toEqual(['3', '4']); // From state3
            expect(merged.amenities).toEqual(['parking']); // From state2
            expect(merged.verifiedOnly).toBe(true); // From state2
            expect(merged.location).toBe('Boston, MA'); // From state3
        });

        it('should handle empty merge gracefully', () => {
            expect(mergeFilterStates()).toEqual(STANDARD_FILTER_STATE);
            expect(mergeFilterStates(null, undefined)).toEqual(STANDARD_FILTER_STATE);
        });
    });

    describe('URL parameter conversion', () => {
        it('should convert filter state to and from URL parameters', () => {
            const filterState = {
                propertyType: 'flat', // Use 'flat' instead of 'apartment'
                priceRange: { min: 1500, max: 3500 },
                bedrooms: ['2', '3'],
                amenities: ['parking', 'gym'],
                furnishing: ['furnished'],
                verifiedOnly: true,
                location: 'Seattle, WA',
                availableFrom: '2024-01-01',
                sortBy: 'price-low',
                viewMode: 'list'
            };

            const urlParams = filterStateToUrlParams(filterState);
            const parsedState = urlParamsToFilterState(urlParams);

            expect(parsedState.propertyType).toBe('flat'); // Should remain 'flat'
            expect(parsedState.priceRange.min).toBe(1500);
            expect(parsedState.priceRange.max).toBe(3500);
            expect(parsedState.bedrooms).toEqual(['2', '3']);
            expect(parsedState.amenities).toEqual(['parking', 'gym']);
            expect(parsedState.verifiedOnly).toBe(true);
            expect(parsedState.location).toBe('Seattle, WA');
            expect(parsedState.sortBy).toBe('price-low');
            expect(parsedState.viewMode).toBe('list');
        });

        it('should handle empty URL parameters', () => {
            const parsedState = urlParamsToFilterState('');
            expect(parsedState).toMatchObject(STANDARD_FILTER_STATE);
        });
    });

    describe('areFilterStatesEqual', () => {
        it('should compare filter states correctly', () => {
            const state1 = {
                propertyType: 'apartment',
                priceRange: { min: 1000, max: 3000 },
                bedrooms: ['2', '3'],
                amenities: ['parking']
            };

            const state2 = {
                propertyType: 'apartment',
                priceRange: { min: 1000, max: 3000 },
                bedrooms: ['3', '2'], // Different order
                amenities: ['parking']
            };

            const state3 = {
                propertyType: 'house', // Different type
                priceRange: { min: 1000, max: 3000 },
                bedrooms: ['2', '3'],
                amenities: ['parking']
            };

            expect(areFilterStatesEqual(state1, state2)).toBe(true); // Order shouldn't matter
            expect(areFilterStatesEqual(state1, state3)).toBe(false); // Different property type
            expect(areFilterStatesEqual(null, null)).toBe(true);
            expect(areFilterStatesEqual(state1, null)).toBe(false);
        });
    });

    describe('searchParamsToFilterState', () => {
        it('should convert search parameters to filter state', () => {
            const searchParams = {
                propertyType: 'flat', // Use 'flat' instead of 'apartment'
                location: { formatted: 'Portland, OR' },
                filters: {
                    priceRange: { min: 1200, max: 2800 },
                    bedrooms: ['1', '2'],
                    verifiedOnly: true
                },
                sort: 'newest'
            };

            const filterState = searchParamsToFilterState(searchParams);

            expect(filterState.propertyType).toBe('flat'); // Should remain 'flat'
            expect(filterState.location).toBe('Portland, OR');
            expect(filterState.priceRange).toEqual({ min: 1200, max: 2800 });
            expect(filterState.bedrooms).toEqual(['1', '2']);
            expect(filterState.verifiedOnly).toBe(true);
            expect(filterState.sortBy).toBe('newest');
        });
    });

    describe('getActiveFilterCount', () => {
        it('should count active filters correctly', () => {
            const filterState = {
                propertyType: 'apartment', // +1
                priceRange: { min: 1000, max: 3000 }, // +1 (non-default range)
                bedrooms: ['2', '3'], // +1
                amenities: [], // 0 (empty)
                verifiedOnly: true, // +1
                location: 'Boston', // +1
                availableFrom: '2024-01-01' // +1
            };

            expect(getActiveFilterCount(filterState)).toBe(6);

            const emptyState = STANDARD_FILTER_STATE;
            expect(getActiveFilterCount(emptyState)).toBe(0);
        });
    });

    describe('clearAllFilters', () => {
        it('should clear all filters while preserving view state', () => {
            const filterState = {
                propertyType: 'apartment',
                priceRange: { min: 1000, max: 3000 },
                bedrooms: ['2', '3'],
                amenities: ['parking'],
                verifiedOnly: true,
                location: 'Boston',
                sortBy: 'price-low',
                viewMode: 'list',
                scrollPosition: 500
            };

            const cleared = clearAllFilters(filterState);

            // Should clear filter values
            expect(cleared.propertyType).toBe('');
            expect(cleared.priceRange).toEqual({ min: 0, max: 100000 });
            expect(cleared.bedrooms).toEqual([]);
            expect(cleared.amenities).toEqual([]);
            expect(cleared.verifiedOnly).toBe(false);
            expect(cleared.location).toBe('');

            // Should preserve view state
            expect(cleared.sortBy).toBe('price-low');
            expect(cleared.viewMode).toBe('list');
            expect(cleared.scrollPosition).toBe(500);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle malformed input gracefully', () => {
            const malformedInputs = [
                null,
                undefined,
                'string',
                123,
                [],
                { propertyType: null, priceRange: 'invalid' }
            ];

            malformedInputs.forEach(input => {
                expect(() => validateFilterState(input)).not.toThrow();
                expect(() => normalizeFilterState(input)).not.toThrow();
                expect(() => getActiveFilterCount(input)).not.toThrow();
            });
        });

        it('should handle circular references and deep objects', () => {
            const circularObj = { propertyType: 'apartment' };
            circularObj.self = circularObj;

            expect(() => normalizeFilterState(circularObj)).not.toThrow();
        });
    });
});