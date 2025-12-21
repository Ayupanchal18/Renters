# Security Audit Logging System

This directory contains the comprehensive security audit logging system for the application. The system provides centralized logging, monitoring, and analysis of security-related events.

## Components

### 1. AuditLogger (`auditLogger.js`)
The core audit logging service that provides:
- **Batch Processing**: Queues audit events and processes them in batches for performance
- **Event Logging**: Logs security events with IP address, user agent, and contextual details
- **Suspicious Activity Detection**: Analyzes patterns to detect potential security threats
- **Statistics Generation**: Provides security metrics and analytics
- **Data Retention**: Automatic cleanup of old audit logs

### 2. Security Monitoring Service (`../services/securityMonitoringService.js`)
Advanced monitoring capabilities including:
- **Real-time Monitoring**: Monitors user activities for suspicious patterns
- **Alert System**: Sends notifications for security events
- **Pattern Detection**: Identifies various attack patterns (brute force, rapid requests, etc.)
- **Risk Assessment**: Calculates risk levels based on activity patterns

### 3. Audit Utilities (`../utils/auditUtils.js`)
Convenient wrapper functions for common audit operations:
- **Event Logging**: Simplified functions for different types of security events
- **Route Middleware**: Automatic audit logging for specific routes
- **Batch Operations**: Utilities for bulk audit operations
- **Data Retrieval**: Functions to query audit logs and statistics

## Usage

### Basic Event Logging

```javascript
import { logSecurityEvent } from '../utils/auditUtils.js';

// Log a security event
await logSecurityEvent(userId, 'password_change', true, {
    previousPasswordAge: '30 days'
}, req);
```

### Specialized Event Logging

```javascript
import { 
    logPasswordEvent, 
    logVerificationEvent, 
    logAccountEvent 
} from '../utils/auditUtils.js';

// Log password-related events
await logPasswordEvent(userId, 'change', true, {}, req);

// Log verification events
await logVerificationEvent(userId, 'email', 'sent', true, {}, req);

// Log account management events
await logAccountEvent(userId, 'deletion', true, {}, req);
```

### Route-Level Audit Middleware

```javascript
import { createRouteAuditMiddleware } from '../utils/auditUtils.js';

// Add audit logging to specific routes
router.post('/sensitive-operation', 
    createRouteAuditMiddleware('sensitive_operation'),
    (req, res) => {
        // Route handler
    }
);
```

### Retrieving Audit Data

```javascript
import { 
    getUserAuditTrail, 
    getSecurityStatistics, 
    checkSuspiciousActivity 
} from '../utils/auditUtils.js';

// Get user's audit trail
const auditTrail = await getUserAuditTrail(userId, {
    limit: 50,
    action: 'password_change',
    startDate: '2023-01-01T00:00:00.000Z'
});

// Get security statistics
const stats = await getSecurityStatistics({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
});

// Check for suspicious activity
const suspiciousActivity = await checkSuspiciousActivity(userId);
```

## Event Types

The system logs the following types of security events:

### Authentication Events
- `auth_login` - User login attempts
- `auth_logout` - User logout events
- `auth_failed` - Failed authentication attempts

### Password Events
- `password_change` - Password change operations
- `password_reset` - Password reset requests
- `password_failed` - Failed password operations

### Verification Events
- `email_otp_sent` - Email OTP generation and sending
- `phone_otp_sent` - SMS OTP generation and sending
- `email_verification` - Email verification attempts
- `phone_verification` - Phone verification attempts
- `email_verification_failed` - Failed email verification
- `phone_verification_failed` - Failed phone verification

### Account Management Events
- `account_update` - Profile updates
- `account_deletion` - Account deletion requests
- `phone_update` - Phone number changes

### Security Alerts
- `security_alert_triggered` - Suspicious activity detected
- `location_change_detected` - Login from new location
- `multiple_ip_verification_attempts` - Verification from multiple IPs
- `rapid_requests_detected` - Rapid successive requests

## Security Features

### Rate Limiting Integration
The audit system integrates with rate limiting to:
- Track failed attempts per user/IP
- Implement progressive delays for repeated failures
- Temporarily lock accounts after excessive failures

### Suspicious Activity Detection
Automatically detects:
- **Excessive Failures**: Too many failed attempts in a time window
- **Rapid Attempts**: Many requests in a short time period
- **Location Changes**: Operations from new IP addresses
- **Multiple IP Attempts**: Verification attempts from different IPs

### Data Protection
- **IP Address Logging**: Tracks source of requests for security analysis
- **User Agent Logging**: Records browser/client information
- **Sensitive Data Handling**: Phone numbers are masked in logs
- **Automatic Cleanup**: Old logs are automatically removed based on retention policy

## Configuration

### Environment Variables

```bash
# Security monitoring
SECURITY_MONITORING_ENABLED=true
SECURITY_ALERTING_ENABLED=true

# Admin notifications
ADMIN_ALERT_EMAIL=admin@example.com

# Audit logging
AUDIT_LOG_ALL_REQUESTS=false
```

### Monitoring Thresholds

The system uses configurable thresholds for detecting suspicious activity:

```javascript
{
    failedLoginAttempts: 5,
    failedOtpAttempts: 3,
    passwordChangeAttempts: 3,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    rapidRequestThreshold: 20,
    rapidRequestWindow: 5 * 60 * 1000 // 5 minutes
}
```

## API Endpoints

The system provides REST API endpoints for accessing audit data:

### User Endpoints
- `GET /api/audit/my-logs` - Get user's own audit logs
- `GET /api/audit/my-security-summary` - Get security activity summary
- `GET /api/audit/check-suspicious-activity` - Check for suspicious activity

### Admin Endpoints (require admin role)
- `GET /api/audit/admin/user-logs/:userId` - Get any user's audit logs
- `GET /api/audit/admin/security-stats` - Get system-wide security statistics
- `GET /api/audit/admin/suspicious-activity/:userId` - Check suspicious activity for any user
- `POST /api/audit/admin/cleanup-logs` - Clean up old audit logs

## Database Schema

### SecurityAuditLog Model

```javascript
{
    userId: String,           // User ID (required)
    action: String,           // Action performed (enum)
    ipAddress: String,        // Source IP address
    userAgent: String,        // User agent string
    success: Boolean,         // Whether action succeeded
    details: Mixed,           // Additional context data
    createdAt: Date,          // Timestamp (auto-generated)
    updatedAt: Date           // Last modified (auto-generated)
}
```

### Indexes
- `userId` - For user-specific queries
- `action` - For action-specific queries
- `success` - For filtering by success/failure
- `createdAt` - For time-based queries and TTL
- Compound indexes for efficient filtering

### Data Retention
- Default retention: 365 days (1 year)
- Automatic cleanup via MongoDB TTL index
- Manual cleanup via admin API endpoint

## Performance Considerations

### Batch Processing
- Events are queued and processed in batches of 10
- Automatic batch processing every 5 seconds
- Reduces database load and improves performance

### Indexing Strategy
- Optimized indexes for common query patterns
- Compound indexes for multi-field queries
- TTL index for automatic data cleanup

### Memory Management
- Limited queue size to prevent memory issues
- Graceful error handling for batch processing failures
- Automatic retry logic for failed operations

## Testing

### Integration Testing
Run the integration test to verify the system:

```bash
node server/test-audit-integration.js
```

### Unit Testing
Run unit tests for individual components:

```bash
npm test server/src/middleware/auditLogger.test.js
```

## Troubleshooting

### Common Issues

1. **Events not appearing in logs**
   - Check if batch processing is working
   - Verify database connection
   - Check for queue processing errors

2. **Performance issues**
   - Monitor batch processing frequency
   - Check database indexes
   - Review queue size and processing time

3. **Missing audit data**
   - Verify middleware is properly installed
   - Check route configuration
   - Review error logs for processing failures

### Debugging

Enable debug logging by setting:
```bash
DEBUG=audit:*
```

This will provide detailed information about:
- Event queuing and processing
- Batch operations
- Error conditions
- Performance metrics

## Security Considerations

### Data Privacy
- Phone numbers are masked in audit logs
- Sensitive details are excluded from logs
- IP addresses are logged for security analysis only

### Access Control
- User endpoints only show user's own data
- Admin endpoints require proper authorization
- Rate limiting prevents abuse of audit endpoints

### Data Integrity
- Immutable audit logs (no updates after creation)
- Cryptographic hashing for sensitive data
- Backup and recovery procedures for audit data