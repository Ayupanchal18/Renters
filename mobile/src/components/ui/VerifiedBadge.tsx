import React from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { BadgeCheck } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";

interface VerifiedBadgeProps {
  size?: number;
}

export default function VerifiedBadge({ size = 16 }: VerifiedBadgeProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    Alert.alert(
      "Verified Account",
      "This landlord or tenant has completed verification by uploading valid government-issued ID and income proofs.",
      [{ text: "Great" }]
    );
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <BadgeCheck size={size} color="#3b82f6" fill="#3b82f6" style={styles.badge} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    display: "flex",
  },
  badge: {
    // We override check color internally using Svg features of lucide icons.
    // Lucide BadgeCheck with a fill and stroke of same color behaves like a filled badge.
  },
});
