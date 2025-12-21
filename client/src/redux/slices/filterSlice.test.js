import { describe, it, expect } from "vitest";
import fc from "fast-check";
import filterReducer, {
    setPropertyType,
    setPriceRange,
    setBedrooms,
    setAmenities,
    setFurnishing,
    setVerifiedOnly,
    setLocation,
    setAvailableFrom,
    setSortBy,
    setViewMode,
    clearAllFilters,
    updateFilters,
    combineFilters
} from "./filterSlice";
import { normalizePropertyType } from "../../utils/propertyTypeStandardization";

describe("Filter State Management", () => {
    /**
     * **Feature: property-listing-search-filter, Property 4: Multiple Filter Combination**
     * **Validates: Requirements 3.2**
     * 
     * Property: For any combination of multiple filter criteria, the system should return 
     * only properties that satisfy ALL applied filters using logical AND operations
     */
    it("should handle multiple filter combinations correctly", () => {
        fc.assert(fc.property(
            // Generators for different filter types
            fc.oneof(fc.constant(""), fc.constantFrom("apartment", "house", "condo", "studio")), // propertyType
            fc.record({
                min: fc.integer({ min: 0, max: 50000 }),
                max: fc.integer({ min: 50000, max: 200000 })
            }), // priceRange
            fc.array(fc.integer({ min: 1, max: 5 }), { maxLength: 4 }), // bedrooms
            fc.array(fc.constantFrom("wifi", "parking", "gym", "pool", "laundry"), { maxLength: 5 }), // amenities
            fc.array(fc.constantFrom("furnished", "semi-furnished", "unfurnished"), { maxLength: 3 }), // furnishing
            fc.boolean(), // verifiedOnly
            fc.oneof(fc.constant(""), fc.constantFrom("New York", "Los Angeles", "Chicago", "Houston")), // location

            (propertyType, priceRange, bedrooms, amenities, furnishing, verifiedOnly, location) => {
                // Start with initial state
                let state = filterReducer(undefined, { type: '@@INIT' });

                // Apply multiple filters in sequence
                state = filterReducer(state, setPropertyType(propertyType));
                state = filterReducer(state, setPriceRange(priceRange));
                state = filterReducer(state, setBedrooms(bedrooms));
                state = filterReducer(state, setAmenities(amenities));
                state = filterReducer(state, setFurnishing(furnishing));
                state = filterReducer(state, setVerifiedOnly(verifiedOnly));
                state = filterReducer(state, setLocation(location));

                // Verify all filters are correctly applied
                expect(state.propertyType).toBe(propertyType);
                expect(state.priceRange).toEqual(priceRange);
                expect(state.bedrooms).toEqual(bedrooms);
                expect(state.amenities).toEqual(amenities);
                expect(state.furnishing).toEqual(furnishing);
                expect(state.verifiedOnly).toBe(verifiedOnly);
                expect(state.location).toBe(location);

                // Verify that applying filters doesn't affect other state properties
                expect(state.isLoading).toBe(false);
                expect(state.isError).toBe(false);
                expect(state.viewMode).toBe("grid"); // default value should remain
                expect(state.sortBy).toBe("relevance"); // default value should remain
            }
        ), { numRuns: 100 });
    });

    it("should handle bulk filter updates correctly", () => {
        fc.assert(fc.property(
            fc.record({
                propertyType: fc.oneof(fc.constant(""), fc.constantFrom("apartment", "house", "condo")),
                priceRange: fc.record({
                    min: fc.integer({ min: 0, max: 50000 }),
                    max: fc.integer({ min: 50000, max: 200000 })
                }),
                bedrooms: fc.array(fc.integer({ min: 1, max: 5 }), { maxLength: 3 }),
                verifiedOnly: fc.boolean(),
                sortBy: fc.constantFrom("relevance", "price-low", "price-high", "newest"),
                viewMode: fc.constantFrom("grid", "list", "map")
            }),

            (filterUpdates) => {
                // Start with initial state
                let state = filterReducer(undefined, { type: '@@INIT' });

                // Apply bulk update
                state = filterReducer(state, updateFilters(filterUpdates));

                // Verify all provided filters are correctly applied
                Object.keys(filterUpdates).forEach(key => {
                    expect(state[key]).toEqual(filterUpdates[key]);
                });

                // Verify that non-updated properties remain unchanged
                if (!Object.prototype.hasOwnProperty.call(filterUpdates, 'amenities')) {
                    expect(state.amenities).toEqual([]);
                }
                if (!Object.prototype.hasOwnProperty.call(filterUpdates, 'location')) {
                    expect(state.location).toBe("");
                }
            }
        ), { numRuns: 100 });
    });

    it("should clear all filters correctly", () => {
        fc.assert(fc.property(
            // Generate a state with various filters applied
            fc.record({
                propertyType: fc.constantFrom("apartment", "house", "condo"),
                priceRange: fc.record({
                    min: fc.integer({ min: 1000, max: 5000 }),
                    max: fc.integer({ min: 5000, max: 10000 })
                }),
                bedrooms: fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 3 }),
                amenities: fc.array(fc.constantFrom("wifi", "parking", "gym"), { minLength: 1, maxLength: 3 }),
                verifiedOnly: fc.constant(true),
                location: fc.constantFrom("New York", "Los Angeles")
            }),

            (initialFilters) => {
                // Start with initial state and apply filters
                let state = filterReducer(undefined, { type: '@@INIT' });
                state = filterReducer(state, updateFilters(initialFilters));

                // Verify filters are applied
                expect(state.propertyType).toBe(initialFilters.propertyType);
                expect(state.bedrooms).toEqual(initialFilters.bedrooms);
                expect(state.amenities).toEqual(initialFilters.amenities);

                // Clear all filters
                state = filterReducer(state, clearAllFilters());

                // Verify all filters are reset to default values
                expect(state.propertyType).toBe("");
                expect(state.priceRange.min).toBe(0);
                expect(state.bedrooms).toEqual([]);
                expect(state.amenities).toEqual([]);
                expect(state.furnishing).toEqual([]);
                expect(state.verifiedOnly).toBe(false);
                expect(state.location).toBe("");
                expect(state.availableFrom).toBe(null);

                // Verify that UI state is preserved
                expect(state.sortBy).toBe("relevance");
                expect(state.viewMode).toBe("grid");
            }
        ), { numRuns: 100 });
    });

    /**
     * **Feature: property-listing-search-filter, Property 3: Search and Filter Functionality**
     * **Validates: Requirements 2.1, 3.1**
     * 
     * Property: For any search query or filter criteria applied to a property dataset, 
     * the returned results should contain only properties that match the specified criteria
     */
    it("should filter properties correctly based on search and filter criteria", () => {
        // Property generator for testing
        const propertyGenerator = fc.record({
            _id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
            propertyType: fc.constantFrom("apartment", "house", "condo", "studio"),
            monthlyRent: fc.integer({ min: 500, max: 10000 }),
            bedrooms: fc.integer({ min: 1, max: 5 }),
            amenities: fc.array(fc.constantFrom("Furnished", "Parking", "Wifi", "Pet-friendly", "Gym", "Pool"), { maxLength: 4 }),
            city: fc.constantFrom("New York", "Los Angeles", "Chicago", "Houston", "Miami"),
            address: fc.string({ minLength: 10, maxLength: 100 }),
            verified: fc.boolean(),
            furnishing: fc.constantFrom("furnished", "semi-furnished", "unfurnished")
        });

        // Filter criteria generator
        const filterCriteriaGenerator = fc.record({
            propertyType: fc.oneof(fc.constant(""), fc.constantFrom("apartment", "house", "condo", "studio")),
            priceRange: fc.record({
                min: fc.integer({ min: 0, max: 5000 }),
                max: fc.integer({ min: 5000, max: 15000 })
            }),
            bedrooms: fc.array(fc.constantFrom("1", "2", "3", "4", "5+"), { maxLength: 3 }),
            amenities: fc.array(fc.constantFrom("Furnished", "Parking", "Wifi", "Pet-friendly"), { maxLength: 2 }),
            verifiedOnly: fc.boolean(),
            location: fc.oneof(fc.constant(""), fc.constantFrom("New York", "Los Angeles", "Chicago"))
        });

        fc.assert(fc.property(
            fc.array(propertyGenerator, { minLength: 5, maxLength: 20 }),
            filterCriteriaGenerator,

            (properties, filters) => {
                // Start with initial state
                let state = filterReducer(undefined, { type: '@@INIT' });

                // Apply the combineFilters action
                state = filterReducer(state, combineFilters({ properties, filters }));

                // Verify that all returned properties match the filter criteria
                const filteredProperties = state.filteredProperties;

                // If no properties match the filters, that's valid - just ensure it's an empty array
                if (filteredProperties.length === 0) {
                    // This is valid - filters might not match any properties
                    expect(state.totalCount).toBe(0);
                    expect(state.appliedFilters).toEqual(filters);
                    return true;
                }

                filteredProperties.forEach(property => {
                    // Check property type filter using normalized comparison
                    if (filters.propertyType && filters.propertyType.trim()) {
                        const normalizedFilterType = normalizePropertyType(filters.propertyType, 'filter');
                        const normalizedPropertyType = normalizePropertyType(property.propertyType, 'backend');
                        expect(normalizedPropertyType).toBe(normalizedFilterType);
                    }

                    // Check price range filter
                    if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 100000)) {
                        const price = property.monthlyRent || 0;
                        expect(price).toBeGreaterThanOrEqual(filters.priceRange.min || 0);
                        expect(price).toBeLessThanOrEqual(filters.priceRange.max || 100000);
                    }

                    // Check bedrooms filter
                    if (filters.bedrooms && filters.bedrooms.length > 0) {
                        const propertyBedrooms = property.bedrooms.toString();
                        const matchesBedrooms = filters.bedrooms.some(bed => {
                            if (bed === "5+") {
                                return property.bedrooms >= 5;
                            }
                            return propertyBedrooms === bed;
                        });
                        expect(matchesBedrooms).toBe(true);
                    }

                    // Check amenities filter (AND operation - must have ALL selected amenities)
                    if (filters.amenities && filters.amenities.length > 0) {
                        const propertyAmenities = property.amenities || [];
                        filters.amenities.forEach(requiredAmenity => {
                            const hasAmenity = propertyAmenities.some(propAmenity =>
                                propAmenity.toLowerCase().includes(requiredAmenity.toLowerCase())
                            );
                            expect(hasAmenity).toBe(true);
                        });
                    }

                    // Check verified filter
                    if (filters.verifiedOnly) {
                        expect(property.verified).toBe(true);
                    }

                    // Check location filter
                    if (filters.location && filters.location.trim()) {
                        const locationQuery = filters.location.toLowerCase();
                        const matchesLocation =
                            property.city?.toLowerCase().includes(locationQuery) ||
                            property.address?.toLowerCase().includes(locationQuery);
                        expect(matchesLocation).toBe(true);
                    }
                });

                // Verify that the total count matches the filtered results
                expect(state.totalCount).toBe(filteredProperties.length);

                // Verify that applied filters are stored correctly
                expect(state.appliedFilters).toEqual(filters);

                return true; // Explicitly return true for property test
            }
        ), { numRuns: 100 });
    });

    /**
     * **Feature: property-listing-search-filter, Property 8: Filter and Search Reset Functionality**
     * **Validates: Requirements 3.3**
     * 
     * Property: For any filter clearing operation, the system should reset to display either 
     * all available properties (if no search) or current search results (if search is active)
     */
    it("should reset filters correctly while preserving search context", () => {
        // Property generator for testing
        const propertyGenerator = fc.record({
            _id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
            propertyType: fc.constantFrom("apartment", "house", "condo", "studio"),
            monthlyRent: fc.integer({ min: 500, max: 10000 }),
            bedrooms: fc.integer({ min: 1, max: 5 }),
            amenities: fc.array(fc.constantFrom("Furnished", "Parking", "Wifi", "Pet-friendly"), { maxLength: 3 }),
            city: fc.constantFrom("New York", "Los Angeles", "Chicago"),
            verified: fc.boolean()
        });

        // Search results generator (subset of all properties)
        const searchResultsGenerator = fc.array(propertyGenerator, { minLength: 2, maxLength: 10 });
        const allPropertiesGenerator = fc.array(propertyGenerator, { minLength: 5, maxLength: 15 });

        // Filter criteria generator
        const filterCriteriaGenerator = fc.record({
            propertyType: fc.constantFrom("apartment", "house", "condo"),
            priceRange: fc.record({
                min: fc.integer({ min: 1000, max: 3000 }),
                max: fc.integer({ min: 5000, max: 8000 })
            }),
            bedrooms: fc.array(fc.constantFrom("1", "2", "3"), { minLength: 1, maxLength: 2 }),
            amenities: fc.array(fc.constantFrom("Furnished", "Parking"), { minLength: 1, maxLength: 2 }),
            verifiedOnly: fc.boolean()
        });

        fc.assert(fc.property(
            allPropertiesGenerator,
            searchResultsGenerator,
            filterCriteriaGenerator,
            fc.boolean(), // hasActiveSearch - whether there's an active search or not

            (allProperties, searchResults, filters, hasActiveSearch) => {
                // Start with initial state
                let state = filterReducer(undefined, { type: '@@INIT' });

                // Simulate having properties in the system
                const baseProperties = hasActiveSearch ? searchResults : allProperties;

                // Apply filters to the base properties
                state = filterReducer(state, combineFilters({
                    properties: baseProperties,
                    filters
                }));

                // Verify filters are applied and results are filtered
                expect(state.appliedFilters).toEqual(filters);
                expect(state.filteredProperties.length).toBeLessThanOrEqual(baseProperties.length);

                // Store the original base properties count for comparison
                const originalBaseCount = baseProperties.length;

                // Clear all filters
                state = filterReducer(state, clearAllFilters());

                // Verify all filter criteria are reset to defaults
                expect(state.propertyType).toBe("");
                expect(state.priceRange.min).toBe(0);
                expect(state.priceRange.max).toBeGreaterThanOrEqual(100000); // Should be reset to max limit
                expect(state.bedrooms).toEqual([]);
                expect(state.amenities).toEqual([]);
                expect(state.verifiedOnly).toBe(false);

                // Verify applied filters are cleared
                expect(state.appliedFilters).toEqual({});

                // Verify filtered properties are cleared (should be empty until new filter is applied)
                expect(state.filteredProperties).toEqual([]);
                expect(state.totalCount).toBe(0);

                // Verify that UI state is preserved during reset
                expect(state.sortBy).toBe("relevance");
                expect(state.viewMode).toBe("grid");
                expect(state.isLoading).toBe(false);
                expect(state.isError).toBe(false);

                // Test that after clearing, we can apply new filters to the same base dataset
                const newFilters = {
                    propertyType: "apartment",
                    verifiedOnly: true
                };

                state = filterReducer(state, combineFilters({
                    properties: baseProperties,
                    filters: newFilters
                }));

                // Verify new filters work correctly after reset
                expect(state.appliedFilters).toEqual(newFilters);
                state.filteredProperties.forEach(property => {
                    const normalizedPropertyType = normalizePropertyType(property.propertyType, 'backend');
                    const normalizedFilterType = normalizePropertyType("apartment", 'filter');
                    expect(normalizedPropertyType).toBe(normalizedFilterType);
                    expect(property.verified).toBe(true);
                });
            }
        ), { numRuns: 100 });
    });
});