import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/tokens';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.border };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'destructive':
        return { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }; // Light red bg
      case 'success':
        return { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' }; // Light green bg
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
