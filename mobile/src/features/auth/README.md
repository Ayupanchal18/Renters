# Mobile Authentication System

## Overview

This mobile authentication system implements a robust token-based authentication with automatic refresh capabilities to prevent session expiration issues.

## Key Features

- **Dual Token System**: Access tokens (15 minutes) + Refresh tokens (7 days)
- **Proactive Token Refresh**: Automatically refreshes tokens before they expire
- **Background Monitoring**: Checks token status every 5 minutes
- **Automatic Retry**: API interceptor handles token refresh on 401 errors
- **Secure Storage**: Uses Expo SecureStore for token persistence
- **Error Handling**: Graceful fallback and user-friendly error messages

## Architecture

### Token Flow

1. **Login/Register**: User receives both access and refresh tokens
2. **API Requests**: Access token attached to all requests
3. **Proactive Refresh**: Token refreshed 2 minutes before expiration
4. **Background Refresh**: Periodic checks every 5 minutes
5. **Automatic Retry**: 401 errors trigger automatic token refresh

### Components

- **AuthContext**: Main authentication state management
- **authService**: API calls for login, register, refresh
- **tokenStorage**: Secure token persistence
- **apiClient**: HTTP client with automatic token handling
- **tokenUtils**: Token validation and expiration utilities

## Usage

### Basic Authentication

```typescript
import { useAuth } from '../features/auth/AuthContext';

function LoginScreen() {
  const { login, isLoading } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // User is now authenticated
    } catch (error) {
      // Handle login error
    }
  };
}
```

### Protected API Calls

```typescript
import { apiClient } from '../api/client';

// Token is automatically attached and refreshed
const response = await apiClient.get('/api/protected-endpoint');
```

### Manual Token Debugging

```typescript
import { debugAuthState } from '../utils/authDebug';

// Debug current token state
await debugAuthState();
```

## Configuration

### Token Expiration Times

- **Access Token**: 15 minutes (configured in backend)
- **Refresh Token**: 7 days (configured in backend)
- **Refresh Buffer**: 2 minutes before expiration
- **Background Check**: Every 5 minutes

### Security Settings

- Tokens stored in Expo SecureStore (encrypted)
- Automatic token cleanup on logout
- No sensitive data in AsyncStorage
- HTTPS-only in production

## Troubleshooting

### Common Issues

1. **"Access token has expired"**
   - Fixed: Proactive refresh prevents this
   - Fallback: Automatic retry with refresh

2. **Session keeps expiring**
   - Fixed: Background monitoring maintains session
   - Improved: Better error handling and retry logic

3. **Token refresh failures**
   - Handled: Graceful fallback to login screen
   - Logged: Debug information for troubleshooting

### Debug Tools

```typescript
// Check current auth state
import { debugAuthState } from '../utils/authDebug';
await debugAuthState();

// Check token expiration
import { isTokenExpired, getTokenTimeRemaining } from '../utils/tokenUtils';
const expired = isTokenExpired(token);
const remaining = getTokenTimeRemaining(token);
```

## Best Practices

1. **Always use useAuth hook** for authentication state
2. **Use apiClient** for all API calls (automatic token handling)
3. **Handle auth errors gracefully** in UI components
4. **Don't store tokens manually** - use the auth system
5. **Test token expiration scenarios** during development

## Migration Notes

### Changes Made

1. **Backend**: Now returns refresh tokens in response body for mobile
2. **Token Storage**: Properly saves both access and refresh tokens
3. **API Client**: Proactive token refresh before requests
4. **Auth Context**: Background token monitoring
5. **Error Handling**: Better 401 error recovery

### Breaking Changes

- `AuthResponse` now includes optional `refreshToken` field
- `RefreshResponse` now includes optional `refreshToken` field
- Token refresh is now automatic (no manual intervention needed)

## Testing

### Test Scenarios

1. **Normal Usage**: Login → API calls → Logout
2. **Token Expiration**: Wait 15+ minutes, verify auto-refresh
3. **Background Refresh**: Leave app open, verify periodic refresh
4. **Network Issues**: Test offline/online scenarios
5. **Concurrent Requests**: Multiple API calls during token refresh

### Debug Commands

```typescript
// Enable auth debugging
import { logAuthEvent } from '../utils/authDebug';
logAuthEvent('Testing token refresh');

// Monitor token state
setInterval(async () => {
  await debugAuthState();
}, 60000); // Every minute
```