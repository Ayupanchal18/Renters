/**
 * Shared Property Type Constants
 * Used by both frontend and backend for consistency
 */

// Listing type enum - rent vs buy
export const LISTING_TYPES = {
    RENT: 'rent',
    BUY: 'buy'
};

// Listing type display labels
export const LISTING_TYPE_LABELS = {
    rent: 'For Rent',
    buy: 'For Sale'
};

// Rent-specific filter configuration
export const RENT_FILTERS = {
    priceField: 'monthlyRent',
    priceLabel: 'Monthly Rent',
    additionalFilters: ['preferredTenants', 'leaseDuration', 'furnished']
};

// Buy-specific filter configuration
export const BUY_FILTERS = {
    priceField: 'sellingPrice',
    priceLabel: 'Price',
    additionalFilters: ['possessionStatus', 'loanAvailable', 'pricePerSqft']
};

// Preferred tenants enum (rent-specific)
export const PREFERRED_TENANTS = ['family', 'bachelor', 'any'];

export const PREFERRED_TENANTS_LABELS = {
    family: 'Family',
    bachelor: 'Bachelor',
    any: 'Any'
};

// Possession status enum (buy-specific)
export const POSSESSION_STATUS = ['ready', 'under_construction', 'resale'];

export const POSSESSION_STATUS_LABELS = {
    ready: 'Ready to Move',
    under_construction: 'Under Construction',
    resale: 'Resale'
};

// Property category enum - matches MongoDB schema
export const PROPERTY_CATEGORIES = ['room', 'flat', 'house', 'pg', 'hostel', 'commercial'];

// Property type constants
export const PROPERTY_TYPES = {
    ROOM: 'room',
    FLAT: 'flat',
    HOUSE: 'house',
    PG: 'pg',
    HOSTEL: 'hostel',
    COMMERCIAL: 'commercial'
};

// Display labels
export const PROPERTY_TYPE_LABELS = {
    room: 'Room',
    flat: 'Flat / Apartment',
    house: 'House',
    pg: 'PG (Paying Guest)',
    hostel: 'Hostel',
    commercial: 'Commercial'
};

// Furnishing options
export const FURNISHING_OPTIONS = ['unfurnished', 'semi', 'fully'];

export const FURNISHING_LABELS = {
    unfurnished: 'Unfurnished',
    semi: 'Semi-Furnished',
    fully: 'Fully Furnished'
};

// Owner types
export const OWNER_TYPES = ['owner', 'agent', 'builder'];

// Property status
export const PROPERTY_STATUS = ['active', 'inactive', 'blocked'];
