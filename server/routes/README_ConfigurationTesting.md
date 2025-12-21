# Configuration Testing API Endpoints

This document describes the configuration testing API endpoints that provide comprehensive testing and diagnostic capabilities for OTP delivery services.

## Overview

The configuration testing endpoints allow administrators to:
- Validate service configurations and credentials
- Test connectivity to external service providers
- Execute test deliveries with detailed diagnostics
- Get comprehensive service status and health metrics
- Access troubleshooting guidance and recommendations

## Authentication

All endpoints require administrative access:
- `x-user-id` header: User ID for audit logging
- `x-admin-key` header: Administrative API key (set via `ADMIN_API_KEY` environment variable)

## Rate Limiting

Test endpoints have separate, more permissive rate limiting:
- **Window**: 5 minutes
- **Limit**: 10 requests per window per user/IP
- **Purpose**: Prevent abuse while allowing thorough testing

## Endpoints

### GET /api/configuration-testing/validate-all

Validates all configured OTP delivery services.

**Response:**
```json
{
  "success": true,
  "message": "All service configurations validated successfully",
  "validation": {
    "success": true,
    "services": {
      "phone-email": {
        "success": true,
        "details": {
          "configured": true,
          "credentialsValid": true,
          "connectivitySuccessful": true,
          "capabilities": ["sms", "email"],
          "priority": 1
        }
      }
    },
    "summary": {
      "totalServices": 3,
      "validServices": 2,
      "invalidServices": 1,
      "primaryServiceValid": true,
      "fallbackServicesAvailable": 1,
      "recommendedActions": ["Configure missing services"]
    }
  },
  "diagnostics": {
    "phone-email": {
      "serviceName": "phone-email",
      "displayName": "Phone.email",
      "configuration": {
        "configured": true,
        "credentialsValid": true,
        "connectivitySuccessful": true,
        "capabilities": ["sms", "email"],
        "priority": 1
      },
      "troubleshooting": []
    }
  },
  "recommendations": ["Configure missing services"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/configuration-testing/validate-service

Validates a specific service configuration.

**Request Body:**
```json
{
  "serviceName": "phone-email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone.email configuration is valid",
  "serviceName": "phone-email",
  "validation": {
    "success": true,
    "details": {
      "configured": true,
      "credentialsValid": true,
      "connectivitySuccessful": true,
      "capabilities": ["sms", "email"],
      "priority": 1
    }
  },
  "diagnostics": {
    "serviceName": "phone-email",
    "displayName": "Phone.email",
    "configuration": {
      "configured": true,
      "credentialsValid": true,
      "connectivitySuccessful": true
    },
    "troubleshooting": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/configuration-testing/test-connectivity

Tests connectivity to a specific service provider.

**Request Body:**
```json
{
  "serviceName": "phone-email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone.email connectivity test successful",
  "serviceName": "phone-email",
  "connectivity": {
    "success": true,
    "accountInfo": {
      "accountId": "acc_123456",
      "balance": 100.50,
      "status": "active"
    }
  },
  "diagnostics": {
    "serviceName": "phone-email",
    "displayName": "Phone.email",
    "configuration": {
      "configured": true,
      "credentialsValid": true,
      "connectivitySuccessful": true
    },
    "connectivity": {
      "success": true,
      "accountInfo": {
        "accountId": "acc_123456",
        "balance": 100.50,
        "status": "active"
      },
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "troubleshooting": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/configuration-testing/test-delivery

Executes test delivery to verify end-to-end functionality.

**Request Body:**
```json
{
  "method": "email",
  "contact": "test@example.com",
  "serviceName": "phone-email",
  "testMessage": "Custom test message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test delivery completed successfully",
  "testResult": {
    "success": true,
    "results": [
      {
        "serviceName": "phone-email",
        "method": "email",
        "success": true,
        "messageId": "msg_123456",
        "duration": 1500,
        "testMode": true
      }
    ],
    "summary": {
      "totalTested": 1,
      "successful": 1,
      "failed": 0
    }
  },
  "diagnostics": {
    "testDelivery": {
      "method": "email",
      "contact": "test@example.com",
      "requestedService": "phone-email",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "message": "Test email delivery to verify configuration"
    },
    "results": [
      {
        "serviceName": "phone-email",
        "method": "email",
        "success": true,
        "messageId": "msg_123456",
        "duration": 1500,
        "testMode": true
      }
    ],
    "summary": {
      "totalTested": 1,
      "successful": 1,
      "failed": 0
    },
    "troubleshooting": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/configuration-testing/service-status

Returns comprehensive status information for all services.

**Response:**
```json
{
  "success": true,
  "message": "Service status retrieved successfully",
  "services": {
    "phone-email": {
      "displayName": "Phone.email",
      "configured": true,
      "enabled": true,
      "primary": true,
      "capabilities": ["sms", "email"],
      "priority": 1,
      "validationStatus": "valid",
      "healthStatus": "healthy",
      "lastValidated": "2024-01-15T10:00:00.000Z",
      "isHealthy": true
    }
  },
  "health": {
    "totalServices": 3,
    "healthyServices": 2,
    "unhealthyServices": 1,
    "primaryServiceHealthy": true,
    "fallbackServicesHealthy": 1,
    "lastValidation": "2024-01-15T10:00:00.000Z",
    "monitoringActive": true
  },
  "available": [
    {
      "serviceName": "phone-email",
      "displayName": "Phone.email",
      "capabilities": ["sms", "email"],
      "priority": 1,
      "isPrimary": true
    }
  ],
  "performance": {
    "phone-email": {
      "totalAttempts": 100,
      "successfulDeliveries": 95,
      "failedDeliveries": 5,
      "averageDeliveryTime": 2500,
      "lastUsed": "2024-01-15T09:45:00.000Z",
      "errorRate": 5
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/configuration-testing/diagnostics

Returns detailed diagnostic information and troubleshooting guidance.

**Query Parameters:**
- `service` (optional): Specific service name to get diagnostics for

**Response:**
```json
{
  "success": true,
  "message": "Diagnostic information retrieved successfully",
  "diagnostics": {
    "phone-email": {
      "serviceName": "phone-email",
      "displayName": "Phone.email",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "configuration": {
        "configured": true,
        "credentialsValid": true,
        "connectivitySuccessful": true,
        "capabilities": ["sms", "email"],
        "priority": 1
      },
      "troubleshooting": []
    },
    "twilio": {
      "serviceName": "twilio",
      "displayName": "Twilio SMS",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "configuration": {
        "configured": false,
        "credentialsValid": false,
        "connectivitySuccessful": false,
        "capabilities": ["sms"],
        "priority": 2
      },
      "troubleshooting": [
        {
          "issue": "Service not configured",
          "solution": "Configure twilio service credentials in environment variables",
          "severity": "critical",
          "requiredEnvVars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
        }
      ]
    }
  },
  "system": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "development",
    "totalServices": 3,
    "healthyServices": 1,
    "recommendations": ["Configure missing services"],
    "commonIssues": [
      {
        "issue": "Missing environment variables",
        "solution": "Ensure all required environment variables are set",
        "affectedServices": ["twilio", "smtp"]
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "User authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Administrative access required for configuration testing"
}
```

### 429 Rate Limited
```json
{
  "success": false,
  "error": "Test rate limit exceeded",
  "message": "Too many test requests. Please wait 5 minutes before trying again.",
  "retryAfter": 180
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid contact format",
  "message": "Please provide a valid email address",
  "troubleshooting": [
    "Email format: user@domain.com"
  ]
}
```

## Troubleshooting Guidance

The API provides contextual troubleshooting information based on detected issues:

### Configuration Issues
- **Missing environment variables**: Lists required variables for each service
- **Invalid credentials**: Provides steps to verify API keys and account status
- **Connectivity problems**: Suggests network and firewall checks

### Service-Specific Guidance
- **Phone.email**: API key validation, account balance checks, endpoint accessibility
- **Twilio**: Account SID/Auth Token verification, phone number configuration
- **SMTP**: Server credentials, hostname/port configuration, authentication settings

### Test Delivery Issues
- **Contact format validation**: Provides format examples for phone/email
- **Rate limiting**: Explains limits and retry timing
- **Service failures**: Maps error codes to specific resolution steps

## Integration with Existing Systems

The configuration testing endpoints integrate with:
- **Configuration Validator**: For service validation and health monitoring
- **Enhanced OTP Manager**: For test delivery execution
- **Audit Logging**: All actions are logged for security and compliance
- **Rate Limiting**: Separate limits for testing vs. production usage

## Security Considerations

- Administrative endpoints require both user authentication and admin key
- Contact information is masked in logs (phone numbers hidden, emails visible)
- Test deliveries are clearly marked to prevent confusion with production OTPs
- Rate limiting prevents abuse of testing functionality
- All actions are audited with user identification and timestamps