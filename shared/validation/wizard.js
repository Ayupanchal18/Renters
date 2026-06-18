/**
 * Centralized validation for the Property Listing Wizard (Consolidated 6-step version).
 */
import { LISTING_TYPES } from '../propertyTypes.js';

// ───────── Format validators ─────────

export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone?.replace(/\s/g, ''));

export const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim());

export const isValidPincode = (pincode) => /^\d{6}$/.test(pincode?.trim());

// ───────── Step validators ─────────

/**
 * Validate a single step. Returns an errors object (empty = valid).
 * @param {number} step - 1-based step number (1 to 6)
 * @param {object} formData - current form data
 * @returns {object} errors keyed by field name
 */
export function validateStep(step, formData) {
    const errors = {};

    switch (step) {
        // Step 1: Basic Info
        case 1:
            if (!formData.listingType) {
                errors.listingType = 'Are you looking to rent out or sell? Select an option to continue.';
            }
            if (!formData.category) {
                errors.category = 'Select the type of property you are listing.';
            }
            if (!formData.title || formData.title.trim().length < 10) {
                errors.title = 'Give your property a descriptive title (at least 10 characters).';
            } else if (formData.title.trim().length > 120) {
                errors.title = 'Title is too long — keep it under 120 characters.';
            }
            if (!formData.propertyType) {
                errors.propertyType = 'Select the property type (e.g., 2 BHK, Studio).';
            }
            if (!formData.availableFrom) {
                errors.availableFrom = 'When is the property available? Select a date.';
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (new Date(formData.availableFrom) < today) {
                    errors.availableFrom = 'Available date cannot be in the past.';
                }
            }
            break;

        // Step 2: Location
        case 2:
            if (!formData.city) {
                errors.city = 'Select the city where your property is located.';
            }
            if (!formData.address || formData.address.trim().length < 10) {
                errors.address = 'Enter the full address including building name, street, and area (at least 10 characters).';
            }
            if (formData.pincode && !isValidPincode(formData.pincode)) {
                errors.pincode = 'Enter a valid 6-digit pin code.';
            }
            // Coordinates check: Map position confirmation
            if (!formData.mapLocation) {
                errors.mapLocation = 'Please confirm the property location on the map.';
            } else {
                const coords = formData.mapLocation.split(',');
                if (coords.length !== 2 || isNaN(parseFloat(coords[0])) || isNaN(parseFloat(coords[1]))) {
                    errors.mapLocation = 'Please click or drag the marker to pin a valid location on the map.';
                }
            }
            break;

        // Step 3: Details & Amenities
        case 3: {
            // Furnishing status
            if (!formData.furnishing) {
                errors.furnishing = 'Select the furnishing status of your property.';
            }

            const isFlat = formData.category === 'flat';
            const isHouse = formData.category === 'house';
            const isCommercial = formData.category === 'commercial';
            const isRoom = formData.category === 'room';
            const isPG = formData.category === 'pg';
            const isHostel = formData.category === 'hostel';

            // Flat / House area and bedroom limits
            if (isFlat || isHouse) {
                if (!formData.builtUpArea && !formData.carpetArea) {
                    errors.builtUpArea = 'Enter at least one area measurement (built-up or carpet area).';
                }
                if (!formData.bedrooms && formData.bedrooms !== 0) {
                    errors.bedrooms = 'How many bedrooms does the property have?';
                }
            }

            // Commercial area checks
            if (isCommercial) {
                if (!formData.builtUpArea && !formData.carpetArea) {
                    errors.builtUpArea = 'Enter the area of your commercial property.';
                }
            }

            // Room / PG / Hostel roomType details
            if (isRoom || isPG || isHostel) {
                if (!formData.roomType) {
                    errors.roomType = 'Select the room type (Single, Double, or Triple).';
                }
            }

            // Cross-field carpet area check
            if (formData.carpetArea && formData.builtUpArea && Number(formData.carpetArea) > Number(formData.builtUpArea)) {
                errors.carpetArea = 'Carpet area cannot be greater than built-up area.';
            }

            // Cross-field floor height check
            if (formData.floorNumber && formData.totalFloors && Number(formData.floorNumber) > Number(formData.totalFloors)) {
                errors.floorNumber = 'Floor number cannot exceed total number of floors.';
            }

            // Owner details verification
            if (!formData.ownerName || formData.ownerName.trim().length < 2) {
                errors.ownerName = 'Enter your full name (at least 2 characters).';
            }
            if (!formData.ownerPhone) {
                errors.ownerPhone = 'Enter your 10-digit mobile number for inquiries.';
            } else if (!isValidPhone(formData.ownerPhone)) {
                errors.ownerPhone = 'Enter a valid 10-digit Indian mobile number.';
            }
            if (!formData.ownerEmail) {
                errors.ownerEmail = 'We\'ll send listing updates and inquiries to this email.';
            } else if (!isValidEmail(formData.ownerEmail)) {
                errors.ownerEmail = 'Enter a valid email address.';
            }
            if (!formData.ownerType) {
                errors.ownerType = 'Select whether you are the owner, agent, or builder.';
            }
            break;
        }

        // Step 4: Photos
        case 4:
            if (!formData.photos || formData.photos.length === 0) {
                errors.photos = 'Upload at least 1 photo of your property.';
            }
            break;

        // Step 5: Virtual Tour (Optional)
        case 5:
            if (formData.virtualTour?.type === 'matterport' && formData.virtualTour?.matterportUrl) {
                try {
                    new URL(formData.virtualTour.matterportUrl);
                } catch (e) {
                    errors.matterportUrl = 'Please enter a valid URL (e.g., https://my.matterport.com/show/?m=...)';
                }
            }
            if (formData.virtualTour?.type === 'video' && formData.virtualTour?.videoUrl) {
                try {
                    new URL(formData.virtualTour.videoUrl);
                } catch (e) {
                    errors.videoUrl = 'Please enter a valid URL (e.g., https://www.youtube.com/watch?v=...)';
                }
            }
            break;

        // Step 6: Pricing
        case 6:
            if (formData.listingType === LISTING_TYPES.RENT) {
                if (!formData.monthlyRent || Number(formData.monthlyRent) <= 0) {
                    errors.monthlyRent = 'Set your monthly rent — you can mark it as negotiable below.';
                } else if (Number(formData.monthlyRent) > 5000000) {
                    errors.monthlyRent = 'Monthly rent seems unusually high. Please verify.';
                }
                // Security deposit limit warning
                if (
                    formData.securityDeposit &&
                    formData.monthlyRent &&
                    Number(formData.securityDeposit) > Number(formData.monthlyRent) * 12
                ) {
                    errors.securityDeposit = 'Security deposit typically doesn\'t exceed 12 months of rent.';
                }
            } else if (formData.listingType === LISTING_TYPES.BUY) {
                if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
                    errors.sellingPrice = 'Enter the selling price for your property.';
                } else if (Number(formData.sellingPrice) < 5000) {
                    errors.sellingPrice = 'Selling price seems too low. Please verify.';
                }
            }
            break;

        // Step 7: Review & Submit
        case 7:
            break;
    }

    return errors;
}

// ───────── Inline field validators (for real-time feedback) ─────────

/**
 * Validate a single field inline.
 * Returns error string or null.
 */
export function validateFieldInline(fieldName, value, formData) {
    switch (fieldName) {
        case 'ownerPhone':
            if (value && !isValidPhone(value))
                return 'Enter a valid 10-digit Indian mobile number.';
            break;
        case 'ownerEmail':
            if (value && !isValidEmail(value))
                return 'Enter a valid email address.';
            break;
        case 'pincode':
            if (value && !isValidPincode(value))
                return 'Enter a valid 6-digit pin code.';
            break;
        case 'title':
            if (value && value.trim().length > 0 && value.trim().length < 10)
                return 'Title should be at least 10 characters.';
            break;
        case 'carpetArea':
            if (value && formData?.builtUpArea && Number(value) > Number(formData.builtUpArea))
                return 'Carpet area cannot exceed built-up area.';
            break;
        case 'floorNumber':
            if (value && formData?.totalFloors && Number(value) > Number(formData.totalFloors))
                return 'Floor number cannot exceed total floors.';
            break;
        case 'securityDeposit':
            if (value && formData?.monthlyRent && Number(value) > Number(formData.monthlyRent) * 12)
                return 'Security deposit typically doesn\'t exceed 12 months of rent.';
            break;
        case 'matterportUrl':
        case 'videoUrl':
            if (value) {
                try {
                    new URL(value);
                } catch (e) {
                    return 'Please enter a valid URL.';
                }
            }
            break;
    }
    return null;
}

// ───────── Listing quality score ─────────

/**
 * Calculate listing quality score (0–100).
 */
export function calculateQualityScore(formData) {
    let score = 0;

    // Essential Info (25 pts)
    if (formData.title && formData.title.trim().length >= 10) score += 5;
    if (formData.description && formData.description.trim().length >= 50) score += 8;
    if (formData.propertyType) score += 4;
    if (formData.category) score += 4;
    if (formData.furnishing) score += 4;

    // Location (15 pts)
    if (formData.city) score += 4;
    if (formData.address && formData.address.trim().length >= 10) score += 4;
    if (formData.locality) score += 4;
    if (formData.pincode && isValidPincode(formData.pincode)) score += 3;

    // Pricing (15 pts)
    if (formData.listingType === LISTING_TYPES.RENT) {
        if (formData.monthlyRent && Number(formData.monthlyRent) > 0) score += 10;
        if (formData.securityDeposit) score += 3;
        if (formData.leaseDuration || formData.lockInPeriod) score += 2;
    } else if (formData.listingType === LISTING_TYPES.BUY) {
        if (formData.sellingPrice && Number(formData.sellingPrice) > 0) score += 10;
        if (formData.pricePerSqft) score += 3;
        if (formData.ownershipType) score += 2;
    }

    // Property Details (15 pts)
    if (formData.builtUpArea || formData.carpetArea) score += 5;
    if (formData.bedrooms || formData.roomType) score += 4;
    if (formData.floorNumber !== '' && formData.floorNumber !== null) score += 3;
    if (formData.propertyAge) score += 3;

    // Photos (20 pts)
    const photoCount = formData.photos?.length || 0;
    if (photoCount >= 10) score += 20;
    else if (photoCount >= 8) score += 16;
    else if (photoCount >= 5) score += 12;
    else if (photoCount >= 3) score += 8;
    else if (photoCount >= 1) score += 4;

    // Amenities (5 pts)
    const amenityCount = formData.amenities?.length || 0;
    if (amenityCount >= 5) score += 5;
    else if (amenityCount >= 3) score += 3;
    else if (amenityCount >= 1) score += 1;

    // Owner Info (5 pts)
    if (formData.ownerName) score += 1;
    if (formData.ownerPhone && isValidPhone(formData.ownerPhone)) score += 2;
    if (formData.ownerEmail && isValidEmail(formData.ownerEmail)) score += 1;
    if (formData.ownerType) score += 1;

    return Math.min(100, score);
}
