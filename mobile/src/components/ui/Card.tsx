import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { BlurView } from 'expo-blur';
import { radius as tokenRadius } from '@shared/theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, variant = 'default', style }: CardProps) {
  const { colors, shadows, isDark } = useTheme();

  if (variant === 'glass') {
    return (
      <View style={[styles.glassWrapper, shadows.soft, style]}>
        <BlurView
          intensity={isDark ? 25 : 35}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.65)',
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        },
        shadows.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassWrapper: {
    borderRadius: tokenRadius.xl, // 14px
    overflow: 'hidden',
  },
  card: {
    borderRadius: tokenRadius.xl, // 14px
    padding: 16,
    borderWidth: 1,
  },
});
