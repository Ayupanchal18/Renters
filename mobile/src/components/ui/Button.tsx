import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radius as tokenRadius, spacing } from '@shared/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.input,
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.textPrimary },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: colors.border,
            borderWidth: 1.5,
          },
          text: { color: colors.textPrimary },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: { color: colors.textPrimary },
        };
      case 'destructive':
        return {
          button: {
            backgroundColor: colors.error,
            borderColor: colors.error,
          },
          text: { color: 'white' },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: { color: 'white' },
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: spacing.xs * 1.5, paddingHorizontal: spacing.sm * 1.5 },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'lg':
        return {
          button: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
          text: { fontSize: 17, fontWeight: '700' },
        };
      case 'md':
      default:
        return {
          button: { paddingVertical: spacing.sm * 1.5, paddingHorizontal: spacing.md },
          text: { fontSize: 15, fontWeight: '600' },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variantStyle.button,
        sizeStyle.button,
        pressed && !disabled && !loading && { transform: [{ scale: 0.96 }], opacity: 0.9 },
        disabled && { opacity: 0.5 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : (
        <Text style={[styles.text, variantStyle.text, sizeStyle.text, textStyle]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: tokenRadius.md + 4, // 12px
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
});
