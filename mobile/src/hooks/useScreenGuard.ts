import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import React from 'react';

interface ScreenGuardOptions {
  requireAuth?: boolean;
  requireRole?: string;
  allowGuest?: boolean;
  redirectTo?: keyof RootStackParamList;
}

interface ScreenGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
  authError: {
    type: 'authentication' | 'authorization' | 'guest' | null;
    message: string;
  } | null;
  user: any;
  redirectUnauthorized: () => void;
}

/**
 * Screen Guard Hook
 * 
 * Provides screen-level protection logic for React Native screens
 */
export function useScreenGuard({
  requireAuth = false,
  requireRole,
  allowGuest = false,
  redirectTo = 'Login'
}: ScreenGuardOptions = {}): ScreenGuardResult {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<ScreenGuardResult['authError']>(null);
  const { isAuthenticated, isGuest, user, isLoading: authLoading, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    setAuthError(null);

    // Check authentication requirements
    if (requireAuth) {
      // Not authenticated and not guest
      if (!isAuthenticated && !isGuest) {
        setAuthError({
          type: 'authentication',
          message: 'Please sign in to access this feature'
        });
        return;
      }

      // Guest trying to access auth-required feature
      if (isGuest && !allowGuest) {
        setAuthError({
          type: 'guest',
          message: 'Create an account or sign in to access this feature'
        });
        return;
      }
    }

    // Check role requirements
    if (requireRole && user?.role !== requireRole) {
      setAuthError({
        type: 'authorization',
        message: `This feature requires ${requireRole} privileges`
      });
      return;
    }

  }, [requireAuth, requireRole, allowGuest, isAuthenticated, isGuest, user, authLoading]);

  const redirectUnauthorized = async () => {
    if (authError?.type === 'authentication' || authError?.type === 'guest') {
      // Logout to reset navigation stack and go to auth flow
      await logout();
    } else if (authError?.type === 'authorization') {
      navigation.navigate('MainTabs' as any);
    }
  };

  const isAuthorized = !authError;

  return {
    isLoading,
    isAuthorized,
    authError,
    user,
    redirectUnauthorized
  };
}

/**
 * Higher-order component for screen protection
 */
export function withScreenGuard<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  guardOptions: ScreenGuardOptions = {}
): React.ComponentType<T> {
  return function GuardedScreen(props: T) {
    const guard = useScreenGuard(guardOptions);

    if (guard.isLoading) {
      return null; // Or a loading component
    }

    if (!guard.isAuthorized) {
      guard.redirectUnauthorized();
      return null;
    }

    return React.createElement(WrappedComponent, props);
  };
}

export default useScreenGuard;