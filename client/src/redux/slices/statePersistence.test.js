import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import filterReducer, {
    setPropertyType,
    setPriceRange,
    setBedrooms,
    setAmenities,
    setViewMode,
    setSortBy,
    updateFilters
} from "./filterSlice";

// Mock URL and history for testing
const mockHistory = {
    replaceState: () => { },
    pushState: () => { }
};

const mockLocation = {
    pathname: '/listings',
    search: ''
};

// Store original values
let originalHistory;
let originalLocation;

describe("State Persistence Across View Changes", () => {
    beforeEach(() => {
        // Mock window.history and window.location
        originalHistory = global.window?.history;
        originalLocation = global.window?.location;

        global.window = {
            ...global.window,
            history: mockHistory,
            location: mockLocation
        };
    });

    afterEach(() => {
        // Restore original values
        if (originalHistory) {
            global.window.history = originalHistory;
        }
        if (originalLocation) {
            global.window.location = originalLocation;
        }
    });

    /**
     * **Feature: property-listing-search-filter, Property 5: State Persistence Across View Changes**
     * **Validates: Requirements 1.4, 3.4**
     * 
     * Property: For any view mode change (grid to list or vice versa), the current search query 
     * and applied filters should remain unchanged
     */
    it("should preserve filters when changing view modes", () => {
        fc.assert(fc.property(
            // Generate initial filter state
            fc.record({
                propertyType: fc.oneof(fc.constant(""), fc.constantFrom("apartment", "house", "condo", "studio")),
                priceRange: fc.record({
                    min: fc.integer({ min: 0, max: 50000 }),
                    max: fc.integer({ min: 50000, max: 200000 })
                }),
                bedrooms: fc.array(fc.integer({ min: 1, max: 5 }), { maxLength: 4 }),
                amenities: fc.array(fc.constantFrom("wifi", "parking", "gym", "pool", "laundry"), { maxLength: 5 }),
                verifiedOnly: fc.boolean(),
                location: fc.oneof(fc.constant(""), fc.constantFrom("New York", "Los Angeles", "Chicago"))
            }),
            // Generate view mode changes
            fc.array(fc.constantFrom("grid", "list", "map"), { minLength: 2, maxLength: 5 }),

            (initialFilters, viewModeChanges) => {
                // Start with initial state and apply filters
                let state = filterReducer(undefined, { type: '@@INIT' });
                state = filterReducer(state, updateFilters(initialFilters));

                // Store the initial filter state for comparison
                const originalFilters = {
                    propertyType: state.propertyType,
                    priceRange: state.priceRange,
                    bedrooms: state.bedrooms,
                    amenities: state.amenities,
                    verifiedOnly: state.verifiedOnly,
                    location: state.location
                };

                // Apply multiple view mode changes
                viewModeChanges.forEach(viewMode => {
                    state = filterReducer(state, setViewMode(viewMode));

                    // Verify that all filters remain unchanged after view mode change
                    expect(state.propertyType).toBe(originalFilters.propertyType);
                    expect(state.priceRange).toEqual(originalFilters.priceRange);
                    expect(state.bedrooms).toEqual(originalFilters.bedrooms);
                    expect(state.amenities).toEqual(originalFilters.amenities);
                    expect(state.verifiedOnly).toBe(originalFilters.verifiedOnly);
                    expect(state.location).toBe(originalFilters.location);

                    // Verify that view mode is updated
                    expect(state.viewMode).toBe(viewMode);
                });
            }
        ), { numRuns: 100 });
    });

    it("should preserve filters when changing sort options", () => {
        fc.assert(fc.property(
            // Generate initial filter state
            fc.record({
                propertyType: fc.constantFrom("apartment", "house", "condo"),
                priceRange: fc.record({
                    min: fc.integer({ min: 1000, max: 5000 }),
                    max: fc.integer({ min: 5000, max: 15000 })
                }),
                bedrooms: fc.array(fc.integer({ min: 1, max: 4 }), { minLength: 1, maxLength: 3 }),
                amenities: fc.array(fc.constantFrom("wifi", "parking", "gym"), { minLength: 1, maxLength: 3 })
            }),
            // Generate sort option changes
            fc.array(fc.constantFrom("relevance", "price-low", "price-high", "newest", "oldest"), { minLength: 2, maxLength: 4 }),

            (initialFilters, sortChanges) => {
                // Start with initial state and apply filters
                let state = filterReducer(undefined, { type: '@@INIT' });
                state = filterReducer(state, updateFilters(initialFilters));

                // Store the initial filter state for comparison
                const originalFilters = {
                    propertyType: state.propertyType,
                    priceRange: state.priceRange,
                    bedrooms: state.bedrooms,
                    amenities: state.amenities
                };

                // Apply multiple sort changes
                sortChanges.forEach(sortBy => {
                    state = filterReducer(state, setSortBy(sortBy));

                    // Verify that all filters remain unchanged after sort change
                    expect(state.propertyType).toBe(originalFilters.propertyType);
                    expect(state.priceRange).toEqual(originalFilters.priceRange);
                    expect(state.bedrooms).toEqual(originalFilters.bedrooms);
                    expect(state.amenities).toEqual(originalFilters.amenities);

                    // Verify that sort option is updated
                    expect(state.sortBy).toBe(sortBy);
                });
            }
        ), { numRuns: 100 });
    });

    it("should maintain filter state consistency during complex UI interactions", () => {
        fc.assert(fc.property(
            // Generate a sequence of mixed UI actions
            fc.array(fc.oneof(
                fc.record({ type: fc.constant('setViewMode'), value: fc.constantFrom("grid", "list", "map") }),
                fc.record({ type: fc.constant('setSortBy'), value: fc.constantFrom("relevance", "price-low", "price-high") }),
                fc.record({ type: fc.constant('setPropertyType'), value: fc.constantFrom("apartment", "house", "condo") }),
                fc.record({ type: fc.constant('setBedrooms'), value: fc.array(fc.integer({ min: 1, max: 4 }), { maxLength: 3 }) })
            ), { minLength: 3, maxLength: 10 }),

            (actions) => {
                // Start with initial state
                let state = filterReducer(undefined, { type: '@@INIT' });

                // Track the last set values for each filter type
                const lastValues = {
                    viewMode: "grid",
                    sortBy: "relevance",
                    propertyType: "",
                    bedrooms: []
                };

                // Apply actions in sequence
                actions.forEach(action => {
                    switch (action.type) {
                        case 'setViewMode':
                            state = filterReducer(state, setViewMode(action.value));
                            lastValues.viewMode = action.value;
                            break;
                        case 'setSortBy':
                            state = filterReducer(state, setSortBy(action.value));
                            lastValues.sortBy = action.value;
                            break;
                        case 'setPropertyType':
                            state = filterReducer(state, setPropertyType(action.value));
                            lastValues.propertyType = action.value;
                            break;
                        case 'setBedrooms':
                            state = filterReducer(state, setBedrooms(action.value));
                            lastValues.bedrooms = action.value;
                            break;
                    }

                    // After each action, verify that the state matches expected values
                    expect(state.viewMode).toBe(lastValues.viewMode);
                    expect(state.sortBy).toBe(lastValues.sortBy);
                    expect(state.propertyType).toBe(lastValues.propertyType);
                    expect(state.bedrooms).toEqual(lastValues.bedrooms);

                    // Verify that other state properties remain consistent
                    expect(state.isLoading).toBe(false);
                    expect(state.isError).toBe(false);
                });
            }
        ), { numRuns: 100 });
    });
});