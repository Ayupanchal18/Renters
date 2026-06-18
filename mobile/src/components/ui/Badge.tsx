import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const { colors, isDark } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.border };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'destructive':
        return {
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
        };
      case 'success':
        return {
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
        };
      case 'warning':
        return {
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
        };
      case 'default':
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'secondary':
        return { color: colors.textSecondary };
      case 'outline':
        return { color: colors.textPrimary };
      case 'destructive':
        return { color: colors.error };
      case 'success':
        return { color: colors.success };
      case 'warning':
        return { color: colors.warning };
      case 'default':
      default:
        return { color: 'white' };
    }
  };

  return (
    <View style={[styles.badge, getVariantStyle(), style]}>
      <Text style={[styles.text, getTextStyle(), textStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
