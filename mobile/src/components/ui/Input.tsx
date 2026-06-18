import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, StyleProp, ViewStyle, TextInputProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radius as tokenRadius, spacing } from '@shared/theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({ label, error, containerStyle, ...props }: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
            color: colors.textPrimary,
          },
        ]}
        placeholderTextColor={colors.textSecondary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: tokenRadius.md + 4, // 12px
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
