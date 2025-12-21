# Email and SMS Services

This directory contains the email and SMS notification services for the dashboard user management system.

## Services Overview

### EmailService (`emailService.js`)
Handles email notifications using SMTP configuration:
- OTP verification emails
- Password change notifications
- Account deletion confirmations
- HTML and plain text email templates

### SMSService (`smsService.js`)
Handles SMS notifications using Twilio:
- OTP verification SMS
- Phone update notifications
- Phone number normalization and validation
- E.164 format support

### NotificationService (`notificationService.js`)
Unified interface that orchestrates both email and SMS services:
- Single interface for all notification types
- Automatic routing based on verification type
- Service status monitoring
- Error handling and logging

## Configuration

### Email Service Configuration

Add the following environment variables to your `.env` file:

```bash
# Email Service Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

**For other providers:**
- **Outlook/Hotmail:** `smtp-mail.outlook.com:587`
- **Yahoo:** `smtp.mail.yahoo.com:587`
- **Custom SMTP:** Use your provider's settings

### SMS Service Configuration

Add the following environment variables to your `.env` file:

```bash
# SMS Service Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**To get Twilio credentials:**
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get a phone number from the Twilio Console
3. Copy Account SID and Auth Token from the dashboard

## Usage

### Basic Usage

```javascript
import notificationService from './notificationService.js';

// Send email OTP
const emailResult = await notificationService.sendEmailOTP(
    'user@example.com',
    '123456',
    'John Doe'
);

// Send SMS OTP
const smsResult = await notificationService.sendSMSOTP(
    '+1234567890',
    '123456',
    'John Doe'
);

// Send OTP (auto-routes based on type)
const otpResult = await notificationService.sendOTP(
    'email', // or 'phone'
    'user@example.com',
    '123456',
    'John Doe'
);
```

### Security Notifications

```javascript
// Password change notification
await notificationService.sendPasswordChangeNotification(
    'user@example.com',
    'John Doe'
);

// Phone update notification
await notificationService.sendPhoneUpdateNotification(
    '+1234567890',
    'John Doe'
);

// Account deletion confirmation
await notificationService.sendAccountDeletionConfirmation(
    'user@example.com',
    'John Doe'
);
```

### Service Status

```javascript
// Check service configuration
const status = notificationService.getServiceStatus();
console.log('Email configured:', status.ready.email);
console.log('SMS configured:', status.ready.sms);

// Test services
const testResults = await notificationService.testServices(
    'test@example.com',
    '+1234567890'
);
```

## Test Mode

When services are not configured (missing environment variables), they operate in test mode:

- **Email Service:** Logs messages to console instead of sending
- **SMS Service:** Logs messages to console instead of sending
- **Response:** Includes `testMode: true` flag
- **Message IDs:** Prefixed with `test-mode-`

This allows development and testing without requiring actual email/SMS configuration.

## Error Handling

All service methods return a consistent response format:

```javascript
{
    success: boolean,
    messageId?: string,      // Email message ID
    messageSid?: string,     // SMS message SID
    error?: string,          // Error message if failed
    testMode?: boolean       // True if running in test mode
}
```

## Phone Number Format

The SMS service automatically normalizes phone numbers to E.164 format:

- `1234567890` → `+11234567890`
- `(123) 456-7890` → `+11234567890`
- `+1-123-456-7890` → `+11234567890`

## Security Features

### Email Security
- HTML and plain text versions for compatibility
- Professional email templates
- No sensitive data in logs
- Proper error handling

### SMS Security
- Phone number validation
- E.164 format normalization
- Rate limiting support
- Message delivery tracking

### General Security
- No OTP codes in production logs
- Secure credential handling
- Service status monitoring
- Comprehensive error handling

## Testing

Run the test suite:

```bash
npm test server/src/services/notificationService.test.js
```

The tests cover:
- Service configuration and status
- Email and SMS functionality
- Error handling
- Phone number normalization
- Security notifications
- Test mode operation

## Integration with Verification Routes

The services are integrated with the verification API endpoints in `server/routes/verification.js`:

- `/api/verification/send-otp` - Uses `notificationService.sendOTP()`
- `/api/verification/service-status` - Uses `notificationService.getServiceStatus()`

## Production Deployment

### Email Service
1. Configure SMTP credentials
2. Set `SMTP_FROM` to your domain email
3. Test email delivery
4. Monitor bounce rates

### SMS Service
1. Set up Twilio account
2. Purchase phone number
3. Configure webhooks (optional)
4. Monitor delivery rates

### Monitoring
- Check service status regularly
- Monitor delivery success rates
- Set up alerts for failures
- Review logs for errors

## Troubleshooting

### Email Issues
- **Authentication failed:** Check SMTP credentials
- **Connection timeout:** Verify SMTP host and port
- **Emails not delivered:** Check spam folders, verify SMTP_FROM

### SMS Issues
- **Invalid credentials:** Verify Twilio Account SID and Auth Token
- **Phone number invalid:** Ensure E.164 format
- **Messages not delivered:** Check Twilio logs, verify phone number

### General Issues
- **Service not configured:** Check environment variables
- **Test mode active:** Verify configuration is loaded
- **Network errors:** Check internet connectivity and firewall settings