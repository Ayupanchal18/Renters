import { z } from "zod";

/**
 * Centralized Validation Schemas for Critical Endpoints
 * 
 * This module provides Zod validation schemas for auth, property, and wishlist endpoints.
 * These schemas ensure consistent validation across the API.
 * 
 * Requirements: 9.1, 9.4
 */

/* ---------------------- COMMON SCHEMAS ---------------------- */

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

/**
 * Pagination schema for query parameters
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
});

/* ---------------------- AUTH SCHEMAS ---------------------- */

/**
 * Password validation with security requirements
 */
export const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number");

/**
 * Email validation with normalization
 */
export const emailSchema = z.string()
    .email("Invalid email format")
    .transform(val => val.toLowerCase().trim());

/**
 * Phone validation
 */
export const phoneSchema = z.string()
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format");

/**
 * Registration request schema
 */
export const registerSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: z.string().max(500, "Address must be at most 500 characters").optional(),
    userType: z.enum(["buyer", "seller", "agent"]).optional(),
    password: passwordSchema,
    acceptTerms: z.boolean().refine(val => val === true, {
        message: "You must accept the Terms of Service"
    }),
    acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
        message: "You must accept the Privacy Policy"
    }),
});

/**
 * Login request schema
 */
export const loginSchema = z.object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(1, "Password is required"),
}).refine(data => data.email || data.phone, {
    message: "Either email or phone is required",
    path: ["email"]
});

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().optional()
});

/* ---------------------- PROPERTY SCHEMAS ---------------------- */

/**
 * Listing type enum
 */
export const listingTypeSchema = z.enum(["rent", "buy"]);

/**
 * Furnishing type enum
 */
export const furnishingSchema = z.enum(["furnished", "semi-furnished", "unfurnished"]);

/**
 * Property status enum
 */
export const propertyStatusSchema = z.enum(["active", "inactive", "pending", "sold", "rented"]);


/**
 * Base property schema with common fields
 */
const basePropertySchema = z.object({
    category: z.string().min(1, "Category is required"),
    title: z.string()
        .min(5, "Title must be at least 5 characters")
        .max(200, "Title must be at most 200 characters"),
    description: z.string().max(5000, "Description must be at most 5000 characters").optional(),
    propertyType: z.string().min(1, "Property type is required"),
    furnishing: furnishingSchema,
    availableFrom: z.string().min(1, "Available from date is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().min(1, "Address is required").max(500, "Address must be at most 500 characters"),

    // Optional fields
    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
    bathrooms: z.coerce.number().int().min(0).max(20).optional(),
    balconies: z.coerce.number().int().min(0).max(10).optional(),
    carpetArea: z.coerce.number().min(0).optional(),
    builtUpArea: z.coerce.number().min(0).optional(),
    superBuiltUpArea: z.coerce.number().min(0).optional(),
    floorNumber: z.coerce.number().int().optional(),
    totalFloors: z.coerce.number().int().min(1).max(200).optional(),
    facing: z.string().optional(),
    ageOfProperty: z.string().optional(),

    // Owner details
    ownerName: z.string().max(100).optional(),
    ownerPhone: phoneSchema.optional(),
    ownerEmail: z.string().email().optional().or(z.literal('')),

    // Location coordinates
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),

    // Amenities
    amenities: z.array(z.string()).optional(),

    // Preferences
    preferredTenants: z.string().optional(),

    // Status
    status: propertyStatusSchema.optional(),
});

/**
 * Rent property creation schema
 */
export const createRentPropertySchema = basePropertySchema.extend({
    listingType: z.literal("rent").optional().default("rent"),
    monthlyRent: z.coerce.number()
        .min(0, "Monthly rent must be a positive number")
        .max(10000000, "Monthly rent exceeds maximum allowed"),
    securityDeposit: z.coerce.number().min(0).optional(),
    maintenanceCharges: z.coerce.number().min(0).optional(),
    lockInPeriod: z.coerce.number().int().min(0).max(36).optional(),
});

/**
 * Buy property creation schema
 */
export const createBuyPropertySchema = basePropertySchema.extend({
    listingType: z.literal("buy").optional().default("buy"),
    sellingPrice: z.coerce.number()
        .min(0, "Selling price must be a positive number")
        .max(100000000000, "Selling price exceeds maximum allowed"),
    pricePerSqFt: z.coerce.number().min(0).optional(),
    possessionStatus: z.string().optional(),
    loanAvailable: z.boolean().optional(),
    registrationCharges: z.coerce.number().min(0).optional(),
    stampDuty: z.coerce.number().min(0).optional(),
});

/**
 * Property update schema (all fields optional)
 */
export const updatePropertySchema = z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().max(5000).optional(),
    propertyType: z.string().optional(),
    furnishing: furnishingSchema.optional(),
    availableFrom: z.string().optional(),
    city: z.string().optional(),
    address: z.string().max(500).optional(),

    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
    bathrooms: z.coerce.number().int().min(0).max(20).optional(),
    balconies: z.coerce.number().int().min(0).max(10).optional(),
    carpetArea: z.coerce.number().min(0).optional(),
    builtUpArea: z.coerce.number().min(0).optional(),
    superBuiltUpArea: z.coerce.number().min(0).optional(),
    floorNumber: z.coerce.number().int().optional(),
    totalFloors: z.coerce.number().int().min(1).max(200).optional(),
    facing: z.string().optional(),
    ageOfProperty: z.string().optional(),

    ownerName: z.string().max(100).optional(),
    ownerPhone: phoneSchema.optional(),
    ownerEmail: z.string().email().optional().or(z.literal('')),

    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),

    amenities: z.array(z.string()).optional(),
    preferredTenants: z.string().optional(),
    status: propertyStatusSchema.optional(),

    // Rent-specific
    monthlyRent: z.coerce.number().min(0).max(10000000).optional(),
    securityDeposit: z.coerce.number().min(0).optional(),
    maintenanceCharges: z.coerce.number().min(0).optional(),
    lockInPeriod: z.coerce.number().int().min(0).max(36).optional(),

    // Buy-specific
    sellingPrice: z.coerce.number().min(0).max(100000000000).optional(),
    pricePerSqFt: z.coerce.number().min(0).optional(),
    possessionStatus: z.string().optional(),
    loanAvailable: z.boolean().optional(),
    registrationCharges: z.coerce.number().min(0).optional(),
    stampDuty: z.coerce.number().min(0).optional(),
});

/**
 * Property search/filter schema
 */
export const propertySearchSchema = z.object({
    q: z.string().optional(),
    query: z.string().optional(),
    searchQuery: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    category: z.string().optional(),
    propertyType: z.string().optional(),
    type: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    sort: z.enum(["newest", "oldest", "rent_low_to_high", "rent_high_to_low",
        "price_low_to_high", "price_high_to_low", "relevance", "featured"]).default("newest"),
    filters: z.object({
        priceRange: z.object({
            min: z.coerce.number().min(0).optional(),
            max: z.coerce.number().min(0).optional(),
        }).optional(),
        bedrooms: z.array(z.union([z.coerce.number(), z.string()])).optional(),
        amenities: z.array(z.string()).optional(),
        furnishing: z.array(furnishingSchema).optional(),
        preferredTenants: z.string().optional(),
        possessionStatus: z.string().optional(),
        loanAvailable: z.boolean().optional(),
        city: z.string().optional(),
        propertyType: z.string().optional(),
    }).optional(),
});

/**
 * Property query params schema (for GET requests)
 */
export const propertyQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    city: z.string().optional(),
    category: z.string().optional(),
    propertyType: z.string().optional(),
    ownerId: objectIdSchema.optional(),
    minRent: z.coerce.number().min(0).optional(),
    maxRent: z.coerce.number().min(0).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    furnishing: furnishingSchema.optional(),
    preferredTenants: z.string().optional(),
    possessionStatus: z.string().optional(),
    loanAvailable: z.string().transform(val => val === 'true').optional(),
    q: z.string().optional(),
    sort: z.string().optional(),
});

/* ---------------------- WISHLIST SCHEMAS ---------------------- */

/**
 * Wishlist property ID param schema
 */
export const wishlistParamsSchema = z.object({
    propertyId: objectIdSchema
});

/* ---------------------- VALIDATION SCHEMAS EXPORT ---------------------- */

/**
 * Auth validation schemas collection
 */
export const authSchemas = {
    register: registerSchema,
    login: loginSchema,
    refreshToken: refreshTokenSchema,
};

/**
 * Property validation schemas collection
 */
export const propertySchemas = {
    createRent: createRentPropertySchema,
    createBuy: createBuyPropertySchema,
    update: updatePropertySchema,
    search: propertySearchSchema,
    query: propertyQuerySchema,
};

/**
 * Wishlist validation schemas collection
 */
export const wishlistSchemas = {
    params: wishlistParamsSchema,
};

export default {
    auth: authSchemas,
    property: propertySchemas,
    wishlist: wishlistSchemas,
    common: {
        objectId: objectIdSchema,
        pagination: paginationSchema,
        email: emailSchema,
        phone: phoneSchema,
        password: passwordSchema,
    }
};
