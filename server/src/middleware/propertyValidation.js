/**
 * Property Validation Middleware
 * Validates property data based on listing type (rent vs buy)
 */

import { LISTING_TYPES } from '../../../shared/propertyTypes.js';

/* ---------------------- FIELD DEFINITIONS ---------------------- */

// Rent-specific fields that are only valid for rent properties
const RENT_SPECIFIC_FIELDS = [
    'monthlyRent',
    'securityDeposit',
    'maintenanceCharge',
    'rentNegotiable',
    'preferredTenants',
    'leaseDuration'
];

// Buy-specific fields that are only valid for buy properties
const BUY_SPECIFIC_FIELDS = [
    'sellingPrice',
    'pricePerSqft',
    'possessionStatus',
    'bookingAmount',
    'loanAvailable'
];

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Check if a value is present and not null/undefined
 * @param {*} value - Value to check
 * @returns {boolean} - True if value is present
 */
const isPresent = (value) => {
    return value !== undefined && value !== null;
};

/**
 * Get fields from request body that match a given list
 * @param {Object} body - Request body
 * @param {string[]} fieldList - List of field names to check
 * @returns {string[]} - Array of present field names
 */
const getPresentFields = (body, fieldList) => {
    return fieldList.filter(field => isPresent(body[field]));
};

/* ---------------------- VALIDATION MIDDLEWARE ---------------------- */

/**
 * Validate Property By Listing Type
 * Ensures rent properties have rent fields and reject buy fields,
 * and buy properties have buy fields and reject rent fields.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validatePropertyByListingType = (req, res, next) => {
    const { listingType } = req.body;

    // Validate listingType is provided
    if (!listingType) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'listingType is required',
            field: 'listingType'
        });
    }

    // Validate listingType is valid enum value
    if (!Object.values(LISTING_TYPES).includes(listingType)) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: "listingType must be 'rent' or 'buy'",
            field: 'listingType'
        });
    }

    // Validate based on listing type
    if (listingType === LISTING_TYPES.RENT) {
        return validateRentProperty(req, res, next);
    }

    if (listingType === LISTING_TYPES.BUY) {
        return validateBuyProperty(req, res, next);
    }

    next();
};

/**
 * Validate Rent Property
 * Ensures rent properties have required rent fields and no buy fields
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRentProperty = (req, res, next) => {
    const { body } = req;

    // Requirement 2.5: monthlyRent is required for rent properties
    if (!isPresent(body.monthlyRent)) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'monthlyRent is required for rent properties',
            field: 'monthlyRent'
        });
    }

    // Convert to number if string (FormData sends strings)
    const monthlyRent = Number(body.monthlyRent);

    // Validate monthlyRent is a positive number
    if (isNaN(monthlyRent) || monthlyRent <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'monthlyRent must be a positive number',
            field: 'monthlyRent'
        });
    }

    // Update body with parsed number
    body.monthlyRent = monthlyRent;

    // Requirement 2.3: Reject buy-specific fields for rent properties
    const presentBuyFields = getPresentFields(body, BUY_SPECIFIC_FIELDS);
    if (presentBuyFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: `${presentBuyFields.join(', ')} not allowed for rent properties`,
            fields: presentBuyFields
        });
    }

    next();
};

/**
 * Validate Buy Property
 * Ensures buy properties have required buy fields and no rent fields
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateBuyProperty = (req, res, next) => {
    const { body } = req;

    // Requirement 2.6: sellingPrice is required for buy properties
    if (!isPresent(body.sellingPrice)) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'sellingPrice is required for buy properties',
            field: 'sellingPrice'
        });
    }

    // Convert to number if string (FormData sends strings)
    const sellingPrice = Number(body.sellingPrice);

    // Validate sellingPrice is a positive number
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'sellingPrice must be a positive number',
            field: 'sellingPrice'
        });
    }

    // Update body with parsed number
    body.sellingPrice = sellingPrice;

    // Requirement 2.4: Reject rent-specific fields for buy properties
    // Only reject if the field has a meaningful value (not empty string)
    const presentRentFields = RENT_SPECIFIC_FIELDS.filter(field => {
        const value = body[field];
        return value !== undefined && value !== null && value !== '' && value !== 'false' && value !== false;
    });

    if (presentRentFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: `${presentRentFields.join(', ')} not allowed for buy properties`,
            fields: presentRentFields
        });
    }

    next();
};

/* ---------------------- EXPORTS ---------------------- */

export default {
    validatePropertyByListingType
};
