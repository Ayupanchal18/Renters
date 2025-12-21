# User Management Hooks

This directory contains custom React hooks for managing user-related operations in the dashboard.

## Available Hooks

### `useVerification`
Manages OTP-based verification operations for email and phone verification.

**Features:**
- Send OTP codes
- Verify OTP codes
- Handle rate limiting and cooldowns
- Track verification attempts
- Manage OTP expiration

**Usage:**
```javascript
import { useVerification } from './hooks/useVerification';

function VerificationComponent() {
    const {
        sendOTP,
        verifyOTP,
        isLoading,
        error,
        otpSent,
        canSendOTP,
        canVerifyOTP,
        resetVerification
    } = useVerification();

    const handleSendOTP = async () => {
        const result = await sendOTP('email', 'user@example.com');
        if (result.success) {
            console.log('OTP sent successfully');
        }
    };

    const handleVerifyOTP = async (otp) => {
        const result = await verifyOTP('email', 'user@example.com', otp);
        if (result.success) {
            console.log('Verification successful');
        }
    };

    return (
        // Your verification UI
    );
}
```

### `useSecurityOperations`
Handles account security operations like password changes, phone updates, and account deletion.

**Features:**
- Change password with validation
- Update phone number with OTP verification
- Delete account with confirmation
- Password strength validation
- Phone number format validation

**Usage:**
```javascript
import { useSecurityOperations } from './hooks/useSecurityOperations';

function SecurityComponent() {
    const {
        changePassword,
        updatePhone,
        deleteAccount,
        validatePasswordStrength,
        validatePhoneNumber,
        isLoading,
        error,
        success
    } = useSecurityOperations();

    const handlePasswordChange = async (currentPassword, newPassword) => {
        const result = await changePassword(currentPassword, newPassword);
        if (result.success) {
            console.log('Password changed successfully');
        }
    };

    return (
        // Your security settings UI
    );
}
```

### `useUserProfile`
Manages user profile data and provides comprehensive user information utilities.

**Features:**
- Update user profile
- Get verification status summary
- Calculate profile completion percentage
- Get user statistics
- Check user roles and permissions
- Property ownership status

**Usage:**
```javascript
import { useUserProfile } from './hooks/useUserProfile';

function ProfileComponent() {
    const {
        user,
        properties,
        updateProfile,
        verificationStatus,
        profileCompletion,
        userStats,
        hasRole,
        isPropertyOwner,
        isLoading,
        updateError,
        updateSuccess
    } = useUserProfile();

    const handleProfileUpdate = async (profileData) => {
        const result = await updateProfile(profileData);
        if (result.success) {
            console.log('Profile updated successfully');
        }
    };

    return (
        <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Profile completion: {profileCompletion.percentage}%</p>
            <p>Verification status: {verificationStatus.verified}/{verificationStatus.total}</p>
            <p>Total properties: {userStats.totalProperties}</p>
            {isPropertyOwner() && <p>You are a property owner</p>}
        </div>
    );
}
```

## Integration with Existing Components

These hooks are designed to work seamlessly with the existing dashboard components:

- **VerificationSection**: Can use `useVerification` for OTP operations
- **SecuritySection**: Can use `useSecurityOperations` for security actions
- **Dashboard**: Can use `useUserProfile` for comprehensive user data

## Error Handling

All hooks provide consistent error handling:
- Loading states for async operations
- Error messages for failed operations
- Success feedback for completed operations
- Proper cleanup and state management

## Messaging & Notifications Hooks

### `useMessages`
Manages messaging state and real-time updates for conversations.

**Features:**
- Conversations list state management
- Selected conversation and messages management
- Real-time message updates via socket
- sendMessage, markAsRead functions
- Loading and error state tracking

**Usage:**
```javascript
import { useMessages } from './hooks/useMessages';

function MessagesComponent() {
    const {
        conversations,
        selectedConversation,
        messages,
        loading,
        sending,
        error,
        fetchConversations,
        selectConversation,
        sendMessage,
        markAsRead,
        createConversation
    } = useMessages();

    const handleSendMessage = async (text) => {
        const result = await sendMessage(text);
        if (result.success) {
            console.log('Message sent');
        }
    };

    return (
        // Your messaging UI
    );
}
```

### `useNotifications`
Manages notification state and real-time updates.

**Features:**
- Notifications list state management
- Real-time notification updates via socket
- markAsRead, markAllAsRead functions
- Unread count tracking
- Pagination support

**Usage:**
```javascript
import { useNotifications } from './hooks/useNotifications';

function NotificationsComponent() {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        loadMore
    } = useNotifications();

    return (
        // Your notifications UI
    );
}
```

### `useUnreadCounts`
Manages unread counts for messages and notifications with real-time updates.

**Features:**
- Fetch initial unread counts on mount
- Subscribe to unread.update socket events
- Message and notification counts
- Optional polling support

**Usage:**
```javascript
import { useUnreadCounts } from './hooks/useUnreadCounts';

function NavbarComponent() {
    const {
        messageCount,
        notificationCount,
        totalCount,
        loading,
        fetchCounts,
        decrementMessageCount,
        decrementNotificationCount
    } = useUnreadCounts();

    return (
        <nav>
            <span>Messages ({messageCount})</span>
            <span>Notifications ({notificationCount})</span>
        </nav>
    );
}
```

## Requirements Validation

These hooks implement the requirements specified in the dashboard user management specification:

- **Requirements 2.1, 2.2, 3.1, 3.2**: Verification operations
- **Requirements 4.1, 5.1, 6.1**: Security operations  
- **Requirements 7.1**: Profile data management

### Messages & Notifications System Requirements:

- **Requirements 2.1, 3.1, 4.1**: useMessages hook for messaging operations
- **Requirements 5.4, 6.1, 7.2**: useNotifications hook for notification management
- **Requirements 7.1, 7.2, 7.3**: useUnreadCounts hook for unread count tracking

The hooks provide proper error handling, loading states, and follow React best practices for custom hook development.