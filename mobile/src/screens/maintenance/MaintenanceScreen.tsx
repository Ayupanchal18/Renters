import React, { useMemo, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wrench, Clock, WifiOff } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useMaintenance } from "../../features/maintenance/MaintenanceContext";

const { width } = Dimensions.get("window");

export default function MaintenanceScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { message, estimatedEndTime } = useMaintenance();

  // Animated wrench bounce
  const bounceAnim = useState(() => new Animated.Value(0))[0];
  // Pulsing glow ring
  const pulseAnim = useState(() => new Animated.Value(1))[0];
  // Fade-in for content
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    // Wrench bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Content fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const formattedTime = estimatedEndTime
    ? new Date(estimatedEndTime).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Animated Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.iconCircle}>
            <Animated.View
              style={{ transform: [{ translateY: bounceAnim }] }}
            >
              <Wrench size={36} color={colors.warning} />
            </Animated.View>
          </View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.contentWrap, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Under Maintenance</Text>
          <Text style={styles.subtitle}>
            {message ||
              "We are currently performing platform upgrades and routine maintenance to enhance your experience. We'll be back online shortly!"}
          </Text>

          {formattedTime && (
            <View style={styles.timeBadge}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.timeText}>
                Estimated Completion: {formattedTime}
              </Text>
            </View>
          )}

          {/* Status Indicators */}
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Systems being updated</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.noteRow}>
            <WifiOff size={16} color={colors.textSecondary} />
            <Text style={styles.noteText}>
              No action needed. The app will automatically resume when maintenance is complete.
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },

    // Icon
    iconContainer: {
      width: 100,
      height: 100,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    pulseRing: {
      position: "absolute",
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: isDark
        ? "rgba(245, 158, 11, 0.2)"
        : "rgba(245, 158, 11, 0.15)",
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: isDark
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(245, 158, 11, 0.08)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(245, 158, 11, 0.25)"
        : "rgba(245, 158, 11, 0.15)",
      justifyContent: "center",
      alignItems: "center",
    },

    // Content
    contentWrap: {
      alignItems: "center",
      maxWidth: 340,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },

    // Time Badge
    timeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: isDark
        ? "rgba(43, 80, 255, 0.08)"
        : "rgba(43, 80, 255, 0.05)",
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(43, 80, 255, 0.2)"
        : "rgba(43, 80, 255, 0.12)",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 24,
    },
    timeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // Status
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 20,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.warning,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textSecondary,
    },

    // Divider
    divider: {
      width: width * 0.5,
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 20,
    },

    // Note
    noteRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 8,
    },
    noteText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      flex: 1,
      textAlign: "center",
    },
  });
