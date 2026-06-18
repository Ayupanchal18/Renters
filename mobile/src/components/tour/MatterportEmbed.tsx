import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable, Linking, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Play, Globe, ExternalLink, AlertTriangle } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { radius, spacing } from "@shared/theme/tokens";
import AnimatedPressable from "../ui/AnimatedPressable";

// Trusted Matterport domains
const ALLOWED_DOMAINS = [
  "my.matterport.com",
  "matterport.com",
  "kuula.co",
  "roundme.com",
  "momento360.com",
];

/**
 * Validate that the URL is from a trusted virtual-tour domain.
 * Returns the sanitized URL string or null if untrusted.
 */
function getSafeUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const match = rawUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
    if (!match) return null;
    const hostname = match[1].toLowerCase();
    const trusted = ALLOWED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith("." + d)
    );
    return trusted ? rawUrl : null;
  } catch {
    return null;
  }
}

interface MatterportEmbedProps {
  url?: string;
  posterImage?: string;
}

export default function MatterportEmbed({ url, posterImage }: MatterportEmbedProps) {
  const { colors } = useTheme();
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const safeUrl = getSafeUrl(url);

  if (!url || !safeUrl) {
    return (
      <View style={[styles.errorCard, { backgroundColor: `${colors.error}08`, borderColor: `${colors.error}33` }]}>
        <AlertTriangle size={24} color={colors.error} style={styles.errorIcon} />
        <View style={styles.errorTextContainer}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>Untrusted Tour URL</Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
            The URL domain is not in our trusted list and cannot be embedded for security reasons.
          </Text>
        </View>
      </View>
    );
  }

  const handleOpenExternal = () => {
    Linking.openURL(safeUrl).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  };

  if (!activated) {
    return (
      <AnimatedPressable
        style={[styles.container, { borderColor: colors.border }]}
        onPress={() => setActivated(true)}
        accessibilityRole="button"
        accessibilityLabel="Launch 3D Virtual Tour"
      >
        <View style={[styles.overlay, { backgroundColor: "rgba(15, 23, 42, 0.85)" }]}>
          {/* Pulsing play icon lookalike container */}
          <View style={styles.playButton}>
            <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.playTitle}>Launch 3D Virtual Tour</Text>
          <View style={styles.platformBadge}>
            <Globe size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.platformText}>Matterport / 3D Space</Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {hasError ? (
        <View style={styles.failedContainer}>
          <AlertTriangle size={32} color={colors.error} style={{ marginBottom: 12 }} />
          <Text style={[styles.failedText, { color: colors.textPrimary }]}>Could not load 3D Tour</Text>
          <View style={styles.failedActions}>
            <Pressable
              style={[styles.failedBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => {
                setHasError(false);
                setLoading(true);
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Retry</Text>
            </Pressable>
            <Pressable
              style={[styles.failedBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenExternal}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>Open in Browser</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, position: "relative" }}>
          <WebView
            source={{ uri: safeUrl }}
            style={{ flex: 1 }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => setHasError(true)}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
          />
          {loading && (
            <View style={[styles.loaderContainer, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading immersive view...</Text>
            </View>
          )}
          <Pressable
            style={styles.externalFloatBtn}
            onPress={handleOpenExternal}
            accessibilityRole="button"
            accessibilityLabel="Open tour in external browser"
          >
            <ExternalLink size={16} color="#ffffff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  playTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  platformText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  errorCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
  },
  errorIcon: {
    marginRight: spacing.md,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  errorDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  externalFloatBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    padding: 8,
    borderRadius: 8,
  },
  failedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
  },
  failedText: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 16,
  },
  failedActions: {
    flexDirection: "row",
    gap: 12,
  },
  failedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
