/**
 * Role-Permission Registry for Granular Admin Access Control
 */
export const ROLE_PERMISSIONS = {
    // Legacy generic admin retains full access for backward compatibility
    admin: ['*'],
    
    // Super Admin has wildcard full access
    super_admin: ['*', 'audit-logs:read'],
    
    // Operations Admin handles support, listings, reviews, and basic auditing
    ops_admin: [
        'dashboard:read',
        'users:read', 'users:write',
        'properties:read', 'properties:write', 'properties:moderate',
        'locations:read',
        'categories:read',
        'cms:read',
        'reviews:read', 'reviews:moderate', 'reviews:bulk',
        'testimonials:read',
        'notifications:read',
        'settings:read',
        'reports:read',
        'otp:read',
        'conversations:read',
        'verifications:read', 'verifications:write'
    ],
    
    // Content Admin manages front-facing CMS, testimonials, categories, and campaigns
    content_admin: [
        'dashboard:read',
        'locations:read', 'locations:write',
        'categories:read', 'categories:write',
        'cms:read', 'cms:write',
        'testimonials:read', 'testimonials:write',
        'notifications:read', 'notifications:write', 'notifications:send'
    ]
};
