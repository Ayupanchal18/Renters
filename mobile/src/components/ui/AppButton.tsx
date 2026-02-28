import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

type AppButtonProps = PropsWithChildren<{
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: any;
  textStyle?: any;
  disabled?: boolean;
}>;

export default function AppButton({
  onPress,
  children,
  variant = "primary",
  style,
  textStyle,
  disabled,
}: AppButtonProps) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" 
          ? { backgroundColor: colors.surface, borderColor: colors.border } 
          : { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && (variant === "secondary" 
          ? { backgroundColor: isDark ? colors.background : "#f2f4f7" } 
          : { backgroundColor: colors.primaryPressed }),
        disabled && { opacity: 0.5 },
        style
      ]}
    >
      <Text style={[
        variant === "secondary" 
          ? { color: colors.textPrimary, fontWeight: "600" } 
          : { color: "#ffffff", fontWeight: "700" },
        styles.textBase,
        textStyle
      ]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBase: {
    fontSize: 16,
  }
});
