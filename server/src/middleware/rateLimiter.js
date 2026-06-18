import { createRateLimiter } from "./security.js";

// Max 60 write actions per minute
export const adminWriteLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: "Too many write actions. Please try again later."
});

// Max 10 bulk operations per minute
export const bulkLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Too many bulk operations. Please try again later."
});

// Max 5 login attempts per hour (bypassed/increased in development)
export const passwordLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: process.env.NODE_ENV === "development" ? 1000 : 5,
    message: "Too many login attempts. Please try again in an hour."
});

// Max 20 downloads/exports per hour
export const exportLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: "Export limit reached. Please try again in an hour."
});
