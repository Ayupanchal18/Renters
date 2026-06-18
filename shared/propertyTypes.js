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

export const OWNER_TYPE_LABELS = {
    owner: 'Owner',
    agent: 'Agent / Broker',
    builder: 'Builder'
};

// Property status
export const PROPERTY_STATUS = ['active', 'inactive', 'blocked'];

// Indian states (Tier 1 & Tier 2 coverage)
export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Chandigarh', 'Puducherry'
];

// Water supply options
export const WATER_SUPPLY_OPTIONS = ['24x7', 'scheduled', 'borewell', 'tanker'];
export const WATER_SUPPLY_LABELS = {
    '24x7': '24×7 Municipal',
    scheduled: 'Scheduled',
    borewell: 'Borewell',
    tanker: 'Tanker'
};

// Power backup options
export const POWER_BACKUP_OPTIONS = ['full', 'partial', 'none'];
export const POWER_BACKUP_LABELS = {
    full: 'Full Backup',
    partial: 'Partial (Lifts & Common Areas)',
    none: 'No Backup'
};

// Ownership types (buy-specific)
export const OWNERSHIP_TYPES = ['freehold', 'leasehold', 'cooperative'];
export const OWNERSHIP_TYPE_LABELS = {
    freehold: 'Freehold',
    leasehold: 'Leasehold',
    cooperative: 'Cooperative Society'
};

// Lock-in periods (rent-specific, in months)
export const LOCK_IN_PERIODS = [0, 3, 6, 11, 12, 24];
export const LOCK_IN_PERIOD_LABELS = {
    0: 'No Lock-in',
    3: '3 Months',
    6: '6 Months',
    11: '11 Months',
    12: '12 Months',
    24: '24 Months'
};
