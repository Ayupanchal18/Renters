import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Shield, Lock, LogIn, Home, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../theme/useTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

interface ProtectedScreenProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
  title?: string;
  message?: string;
}

/**
 * ProtectedScreen Component
 * 
 * Wraps screens that require authentication or specific roles
 * Shows appropriate UI when access is denied
 */
export default function ProtectedScreen({
  children,
  requireAuth = true,
  requireRole,
  title,
  message
}: ProtectedScreenProps) {
  const { isAuthenticated, isGuest, user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignIn = async () => {
    // Logout to reset navigation stack and go to auth flow
    await logout();
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const handleGoHome = () => {
    navigation.navigate('MainTabs');
  };

  // Check authentication
  if (requireAuth && !isAuthenticated && !isGuest) {
    return (
      <UnauthorizedAccess
        type="authentication"
        title={title || "Sign In Required"}
        message={message || "Please sign in to access this feature"}
        onSignIn={handleSignIn}
        onGoBack={handleGoBack}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  // Check role requirements
  if (requireRole && user?.role !== requireRole) {
    return (
      <UnauthorizedAccess
        type="authorization"
        title="Access Denied"
        message={`This feature requires ${requireRole} privileges`}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  // Check if guest trying to access auth-required features
  if (requireAuth && isGuest) {
    return (
      <UnauthorizedAccess
        type="guest"
        title="Account Required"
        message="Create an account or sign in to access this feature"
        onSignIn={handleSignIn}
        onGoBack={handleGoBack}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  return <>{children}</>;
}

interface UnauthorizedAccessProps {
  type: 'authentication' | 'authorization' | 'guest';
  title: string;
  message: string;
  onSignIn?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  colors: any;
  isDark: boolean;
}

function UnauthorizedAccess({
  type,
  title,
  message,
  onSignIn,
  onGoBack,
  onGoHome,
  colors,
  isDark
}: UnauthorizedAccessProps) {
  const styles = getStyles(colors, isDark);

  const getIcon = () => {
    switch (type) {
      case 'authentication':
      case 'guest':
        return <Lock size={48} color={colors.primary} />;
      case 'authorization':
        return <Shield size={48} color={colors.error} />;
      default:
        return <Lock size={48} color={colors.primary} />;
    }
  };

  const getIconBackgroundColor = () => {
    switch (type) {
      case 'authentication':
      case 'guest':
        return isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)';
      case 'authorization':
        return isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      default:
        return isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
          {getIcon()}
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {onSignIn && (
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onSignIn}>
              <LogIn size={20} color={colors.background} />
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}

          {onGoHome && (
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onGoHome}>
              <Home size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Go Home</Text>
            </TouchableOpacity>
          )}

          {onGoBack && (
            <TouchableOpacity style={[styles.button, styles.ghostButton]} onPress={onGoBack}>
              <ArrowLeft size={20} color={colors.textSecondary} />
              <Text style={styles.ghostButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Additional Info for Authorization Errors */}
        {type === 'authorization' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              If you believe you should have access to this feature, please contact support.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.1)',
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export { ProtectedScreen };