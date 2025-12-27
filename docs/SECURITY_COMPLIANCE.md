# Security & Privacy Compliance Documentation

## Overview
This document outlines the security and privacy measures implemented in the Renters application to ensure GDPR-like compliance and production-grade security.

## 1. User Data Classification

### Personal Data (Stored)
- Name, Email (normalized to lowercase), Phone, Address, Profile image

### Sensitive Data (Protected)
- Passwords: Hashed with bcrypt (12 salt rounds)
- Authentication tokens: JWT with short expiry
- Refresh tokens: httpOnly cookies only

### Non-sensitive Data
- Property listings, Search filters, UI preferences

## 2. Password & Authentication Security

### Password Requirements
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- Password history tracking (prevents reuse)

### Token Security
- Access tokens: 15-minute expiry (short-lived)
- Refresh tokens: 7-day expiry, httpOnly cookies
- JWT_SECRET: Required environment variable (min 32 chars)
- No fallback secrets in production

### Rate Limiting
- Login: 5 attempts per 15 minutes per identifier
- Global API: 100 requests per 15 minutes per IP
- OTP endpoints: 10 requests per 15 minutes

## 3. Database Security

### Configuration
- MONGO_URI: Required environment variable (no hardcoded credentials)
- Email normalization (lowercase)
- Indexed fields: email, phone, userId, role

### Data Protection
- Soft delete support (isDeleted flag)
- Timestamps: createdAt, updatedAt
- Password history for reuse prevention

## 4. User Consent (GDPR Compliance)

### Registration Requirements
- ✅ Terms of Service acceptance (required)
- ✅ Privacy Policy acceptance (required)
- ✅ Data processing consent (required)
- Consent timestamps stored in database
- Policy version tracking

### User Rights Implemented
- View my data: GET /api/privacy/dashboard
- Update my data: PATCH /api/privacy/settings
- Delete my account: DELETE /api/privacy/delete-account
- Download my data: POST /api/privacy/export (JSON/CSV)

## 5. Role-Based Access Control (RBAC)

### Roles
- `user`: Standard user access
- `seller`: Property listing capabilities
- `admin`: Full administrative access

### Middleware Protection
- `authenticateToken`: JWT verification
- `requireRole(roles)`: Role-based authorization
- `requireAdmin`: Admin-only routes
- `requireOwnership`: Resource ownership verification

## 6. API Security

### Headers (via securityHeaders middleware)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security (production)
- Content-Security-Policy
- Permissions-Policy

### CORS Configuration
- Restricted origins (configurable via ALLOWED_ORIGINS)
- Credentials support for cookies
- Preflight caching (24 hours)

### Input Validation
- Zod schema validation on all endpoints
- XSS sanitization middleware
- Request body size limits (10MB)

## 7. Cookie & Session Policy

### Refresh Token Cookie
```javascript
{
  httpOnly: true,
  secure: true, // production only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}
```

### Storage Policy
- Access tokens: localStorage (short-lived)
- Refresh tokens: httpOnly cookies only
- User data: localStorage (sanitized, no sensitive fields)
- Never stored: passwords, tokens in user object

## 8. Audit Logging

### Logged Events
- Authentication (login, logout, register)
- Password changes
- Account modifications
- Data access requests
- Privacy settings changes

### Not Logged (Security)
- Passwords
- Token values
- OTP codes

## 9. Environment Variables Required

```env
# Required
MONGO_URI=mongodb://...
JWT_SECRET=<min-32-characters>

# Recommended
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com

# Optional
AUDIT_LOG_ALL_REQUESTS=false
ALLOW_DEV_AUTH=false
```

## 10. Compliance Checklist

| Requirement | Status | Implementation |
|------------|--------|----------------|
| User consent required | ✅ | Signup form with 3 checkboxes |
| Data minimization | ✅ | Only essential data collected |
| Secure authentication | ✅ | JWT + bcrypt + rate limiting |
| Encrypted storage | ✅ | bcrypt passwords, HTTPS |
| Access control | ✅ | RBAC middleware |
| Data deletion support | ✅ | Soft delete + full deletion API |
| Audit logging | ✅ | Comprehensive security logs |
| Privacy-first design | ✅ | Privacy settings, consent tracking |
| HTTPS enforcement | ✅ | HSTS + redirect middleware |
| Secure cookies | ✅ | httpOnly, secure, sameSite |

## 11. Frontend Privacy Pages

- `/privacy-policy` - Full privacy policy
- `/terms` - Terms of service
- Dashboard privacy settings section

## Security Contact

For security concerns, contact: security@renters.com
