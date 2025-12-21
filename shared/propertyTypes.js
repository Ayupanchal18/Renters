/**
 * Shared Property Type Constants
 * Used by both frontend and backend for consistency
 */

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
