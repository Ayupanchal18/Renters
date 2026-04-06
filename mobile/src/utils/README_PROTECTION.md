# Mobile App Screen Protection System

## Overview

This document outlines the comprehensive screen protection system implemented for the React Native mobile app, ensuring proper access control and user-friendly feedback for unauthorized access attempts.

## Protected Screens

### Authentication Required (Full Auth - No Guest Access)
- **PostProperty** - Requires full authentication to post property listings
- **Messages** - Requires authentication to access messaging system  
- **Notifications** - Requires authentication to view notifications
- **EditProfile** - Requires authentication to edit user profile
- **ChangePassword** - Requires authentication to change password
- **ChangePhone** - Requires authentication to change phone number
- **DeleteAccount** - Requires authentication to delete account
- **OTPVerification** - Requires authentication for OTP verification

### Guest Accessible (Limited Functionality)
- **WishlistTab** - Shows sign-in prompt for guests, full functionality for authenticated users
- **HomeTab** - Public access with limited features for guests
- **RentTab** - Public property browsing
- **BuyTab** - Public property browsing  
- **PropertyDetail** - Public property viewing

### Public Screens (No Protection)
- **About** - Information about the app
- **FAQ** - Frequently asked questions
- **Contact** - Contact information
- **Legal** - Legal documents and terms

## Protection Components

### 1. ProtectedScreen Component
**Location**: `mobile/src/components/auth/ProtectedScreen.tsx`

A wrapper component that provides screen-level protection with customizable access requirements:

```typescript
<ProtectedScreen 
  requireAuth={true}
  requireRole="admin" // optional
  title="Custom Title"
  message="Custom message"
>
  <YourScreenContent />
</ProtectedScreen>
```

**Features**:
- Authentication checking
- Role-based access control
- Guest access handling
- User-friendly unauthorized access UI
- Automatic redirects to appropriate screens

### 2. useScreenGuard Hook
**Location**: `mobile/src/hooks/useScreenGuard.ts`

A reusable hook for programmatic access control:

```typescript
const guard = useScreenGuard({
  requireAuth: true,
  requireRole: 'admin',
  allowGuest: false,
  redirectTo: 'Login'
});

if (!guard.isAuthorized) {
  guard.redirectUnauthorized();
  return null;
}
```

### 3. Screen Protection Utilities
**Location**: `mobile/src/utils/screenProtection.ts`

Centralized configuration and utilities:
- Screen access level definitions
- Role hierarchy management
- User-friendly error messages
- Protection configuration presets

## User Experience Features

### Unauthorized Access UI
When users try to access protected screens without proper permissions, they see:

1. **Authentication Required**:
   - Lock icon with blue background
   - "Sign In Required" title
   - Clear explanation message
   - "Sign In" button (primary action)
   - "Go Back" button (secondary action)

2. **Authorization Denied**:
   - Shield icon with red background
   - "Access Denied" title
   - Role-specific error message
   - "Go Home" and "Go Back" buttons
   - Contact support information

3. **Guest Limitations**:
   - Lock icon with blue background
   - "Account Required" title
   - Feature-specific messaging
   - "Sign In" and "Create Account" options

### Navigation Behavior
- **Authentication errors**: Redirect to Login screen
- **Authorization errors**: Redirect to Home screen
- **Preserve intended destination**: After login, users return to their intended screen
- **Graceful fallbacks**: Always provide way to navigate back or home

## Implementation Examples

### Basic Protection
```typescript
// Wrap entire screen
export default function MyProtectedScreen() {
  return (
    <ProtectedScreen requireAuth={true}>
      <MyScreenContent />
    </ProtectedScreen>
  );
}
```

### Advanced Protection with Role
```typescript
// Admin-only screen
export default function AdminScreen() {
  return (
    <ProtectedScreen 
      requireAuth={true}
      requireRole="admin"
      title="Admin Access Required"
      message="You need administrator privileges to access this feature"
    >
      <AdminContent />
    </ProtectedScreen>
  );
}
```

### Programmatic Protection
```typescript
export default function ConditionalScreen() {
  const guard = useScreenGuard({ requireAuth: true });
  
  if (guard.isLoading) return <LoadingSpinner />;
  if (!guard.isAuthorized) {
    guard.redirectUnauthorized();
    return null;
  }
  
  return <ScreenContent />;
}
```

### Guest Handling
```typescript
export default function WishlistScreen() {
  const { isGuest } = useAuth();
  
  if (isGuest) {
    return <GuestPromptUI />;
  }
  
  return <AuthenticatedWishlistContent />;
}
```

## Security Considerations

1. **Client-Side Only**: This protection is for UX only - server-side validation is still required
2. **Token Validation**: Authentication state is validated against JWT tokens
3. **Role Verification**: User roles are checked from decoded token payload
4. **Graceful Degradation**: System fails safely with appropriate user feedback
5. **No Sensitive Data**: Protection logic doesn't expose sensitive information

## Configuration

Screen protection is configured in `screenProtection.ts`:

```typescript
export const SCREEN_PROTECTION_CONFIG = {
  PostProperty: { requireAuth: true, allowGuest: false },
  Messages: { requireAuth: true, allowGuest: false },
  WishlistTab: { requireAuth: false, allowGuest: true },
  // ... more configurations
};
```

## Testing

To test the protection system:

1. **Unauthenticated Access**: Try accessing protected screens without login
2. **Guest Access**: Use "Continue as Guest" and test limited functionality
3. **Role-Based Access**: Test with different user roles (if implemented)
4. **Navigation Flow**: Verify redirects and return-to-intended-page functionality
5. **Error Handling**: Test with invalid tokens or network issues

## Future Enhancements

1. **Biometric Authentication**: Add fingerprint/face ID for sensitive screens
2. **Session Timeout**: Automatic logout after inactivity
3. **Progressive Permissions**: Request permissions as needed
4. **Offline Handling**: Graceful behavior when offline
5. **Analytics**: Track unauthorized access attempts for security monitoring