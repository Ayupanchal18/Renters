/**
 * Screen Protection Utilities
 * 
 * Centralized configuration for mobile screen protection
 */

// Define protected screens and their requirements
export const PROTECTED_SCREENS = {
  // Authentication required screens
  AUTHENTICATED: [
    'PostProperty',
    'Messages', 
    'Notifications',
    'EditProfile',
    'ChangePassword',
    'ChangePhone',
    'DeleteAccount',
    'OTPVerification'
  ],
  
  // Screens that require full authentication (no guest access)
  FULL_AUTH_REQUIRED: [
    'PostProperty',
    'Messages',
    'EditProfile', 
    'ChangePassword',
    'ChangePhone',
    'DeleteAccount',
    'OTPVerification'
  ],

  // Admin role required screens
  ADMIN: [
    // Add admin screens here when implemented
  ] as string[],

  // Screens accessible to guests with limited functionality
  GUEST_ACCESSIBLE: [
    'HomeTab',
    'RentTab', 
    'BuyTab',
    'PropertyDetail',
    'About',
    'FAQ',
    'Contact',
    'Legal'
  ]
};

// Screen access levels
export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  GUEST: 'guest',
  AUTHENTICATED: 'authenticated',
  ADMIN: 'admin'
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

/**
 * Check if a screen requires authentication
 */
export const requiresAuthentication = (screenName: string): boolean => {
  return PROTECTED_SCREENS.AUTHENTICATED.includes(screenName);
};

/**
 * Check if a screen requires full authentication (no guest access)
 */
export const requiresFullAuth = (screenName: string): boolean => {
  return PROTECTED_SCREENS.FULL_AUTH_REQUIRED.includes(screenName);
};

/**
 * Check if a screen is accessible to guests
 */
export const isGuestAccessible = (screenName: string): boolean => {
  return PROTECTED_SCREENS.GUEST_ACCESSIBLE.includes(screenName);
};

/**
 * Check if a screen requires admin access
 */
export const requiresAdminAccess = (screenName: string): boolean => {
  return PROTECTED_SCREENS.ADMIN.includes(screenName);
};

/**
 * Get required access level for a screen
 */
export const getRequiredAccessLevel = (screenName: string): string => {
  if (requiresAdminAccess(screenName)) {
    return ACCESS_LEVELS.ADMIN;
  }
  
  if (requiresFullAuth(screenName)) {
    return ACCESS_LEVELS.AUTHENTICATED;
  }
  
  if (requiresAuthentication(screenName)) {
    return ACCESS_LEVELS.GUEST; // Can be accessed by guests with limitations
  }
  
  return ACCESS_LEVELS.PUBLIC;
};

/**
 * Check if user role meets required access level
 */
export const hasRequiredAccess = (userRole: string | null, requiredLevel: string, isGuest: boolean = false): boolean => {
  const roleHierarchy = {
    [USER_ROLES.USER]: [ACCESS_LEVELS.PUBLIC, ACCESS_LEVELS.GUEST, ACCESS_LEVELS.AUTHENTICATED],
    [USER_ROLES.ADMIN]: [ACCESS_LEVELS.PUBLIC, ACCESS_LEVELS.GUEST, ACCESS_LEVELS.AUTHENTICATED, ACCESS_LEVELS.ADMIN]
  };
  
  // Guest access
  if (isGuest) {
    return [ACCESS_LEVELS.PUBLIC, ACCESS_LEVELS.GUEST].includes(requiredLevel);
  }
  
  // Authenticated user access
  const userPermissions = roleHierarchy[userRole || ''] || [ACCESS_LEVELS.PUBLIC];
  return userPermissions.includes(requiredLevel);
};

/**
 * Get user-friendly screen names for error messages
 */
export const SCREEN_NAMES = {
  'PostProperty': 'Post Property',
  'Messages': 'Messages',
  'Notifications': 'Notifications', 
  'WishlistTab': 'Wishlist',
  'EditProfile': 'Edit Profile',
  'ChangePassword': 'Change Password',
  'ChangePhone': 'Change Phone',
  'DeleteAccount': 'Delete Account',
  'OTPVerification': 'OTP Verification'
};

/**
 * Get friendly name for a screen
 */
export const getScreenName = (screenName: string): string => {
  return SCREEN_NAMES[screenName as keyof typeof SCREEN_NAMES] || screenName;
};

/**
 * Generate appropriate error message for unauthorized access
 */
export const getUnauthorizedMessage = (screenName: string, userRole: string | null = null, isGuest: boolean = false) => {
  const friendlyName = getScreenName(screenName);
  const requiredLevel = getRequiredAccessLevel(screenName);
  
  if (requiredLevel === ACCESS_LEVELS.AUTHENTICATED && isGuest) {
    return {
      type: 'guest' as const,
      title: 'Account Required',
      message: `Create an account or sign in to access ${friendlyName}.`,
      action: 'signup'
    };
  }
  
  if (requiredLevel === ACCESS_LEVELS.AUTHENTICATED && !userRole) {
    return {
      type: 'authentication' as const,
      title: 'Sign In Required', 
      message: `Please sign in to access ${friendlyName}.`,
      action: 'login'
    };
  }
  
  if (requiredLevel === ACCESS_LEVELS.ADMIN && userRole !== USER_ROLES.ADMIN) {
    return {
      type: 'authorization' as const,
      title: 'Admin Access Required',
      message: `You need administrator privileges to access ${friendlyName}.`,
      action: 'contact_admin'
    };
  }
  
  return {
    type: 'authorization' as const,
    title: 'Access Denied',
    message: `You do not have permission to access ${friendlyName}.`,
    action: 'go_home'
  };
};

/**
 * Screen protection configuration for easy setup
 */
export const SCREEN_PROTECTION_CONFIG = {
  // Screens that require full authentication
  PostProperty: { requireAuth: true, allowGuest: false },
  Messages: { requireAuth: true, allowGuest: false },
  Notifications: { requireAuth: true, allowGuest: false },
  EditProfile: { requireAuth: true, allowGuest: false },
  ChangePassword: { requireAuth: true, allowGuest: false },
  ChangePhone: { requireAuth: true, allowGuest: false },
  DeleteAccount: { requireAuth: true, allowGuest: false },
  OTPVerification: { requireAuth: true, allowGuest: false },
  
  // Screens accessible to guests but with limited functionality
  WishlistTab: { requireAuth: false, allowGuest: true },
  
  // Public screens (no protection needed)
  HomeTab: { requireAuth: false, allowGuest: true },
  RentTab: { requireAuth: false, allowGuest: true },
  BuyTab: { requireAuth: false, allowGuest: true },
  PropertyDetail: { requireAuth: false, allowGuest: true },
  About: { requireAuth: false, allowGuest: true },
  FAQ: { requireAuth: false, allowGuest: true },
  Contact: { requireAuth: false, allowGuest: true },
  Legal: { requireAuth: false, allowGuest: true }
};

export default {
  PROTECTED_SCREENS,
  ACCESS_LEVELS,
  USER_ROLES,
  requiresAuthentication,
  requiresFullAuth,
  isGuestAccessible,
  requiresAdminAccess,
  getRequiredAccessLevel,
  hasRequiredAccess,
  getScreenName,
  getUnauthorizedMessage,
  SCREEN_PROTECTION_CONFIG
};