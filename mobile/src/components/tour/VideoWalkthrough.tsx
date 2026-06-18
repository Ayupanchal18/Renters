import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Video, ResizeMode } from "expo-av";
import { Play, Video as VideoIcon, AlertTriangle } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { radius, spacing } from "@shared/theme/tokens";
import AnimatedPressable from "../ui/AnimatedPressable";

interface VideoWalkthroughProps {
  videoUrl?: string;
  posterImage?: string;
}

function isYouTubeOrVimeo(url?: string): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function getEmbedUrl(videoUrl?: string): string | null {
  if (!videoUrl) return null;
  
  // YouTube
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = videoUrl.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0`;
  }

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/i;
  const vimeoMatch = videoUrl.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

export default function VideoWalkthrough({ videoUrl, posterImage }: VideoWalkthroughProps) {
  const { colors } = useTheme();
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!videoUrl) {
    return (
      <View style={[styles.errorCard, { backgroundColor: `${colors.error}08`, borderColor: `${colors.error}33` }]}>
        <AlertTriangle size={20} color={colors.error} style={{ marginRight: 12 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
          No video URL provided.
        </Text>
      </View>
    );
  }

  const isWebVideo = isYouTubeOrVimeo(videoUrl);
  const embedUrl = getEmbedUrl(videoUrl);

  if (isWebVideo && !embedUrl) {
    return (
      <View style={[styles.errorCard, { backgroundColor: `${colors.error}08`, borderColor: `${colors.error}33` }]}>
        <AlertTriangle size={20} color={colors.error} style={{ marginRight: 12 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
          Invalid YouTube or Vimeo video link.
        </Text>
      </View>
    );
  }

  if (!activated) {
    return (
      <AnimatedPressable
        style={[styles.container, { borderColor: colors.border }]}
        onPress={() => setActivated(true)}
        accessibilityRole="button"
        accessibilityLabel="Play Video Walkthrough"
      >
        <View style={[styles.overlay, { backgroundColor: "rgba(15, 23, 42, 0.8)" }]}>
          <View style={styles.playButton}>
            <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.playTitle}>Play Video Walkthrough</Text>
          <View style={styles.platformBadge}>
            <VideoIcon size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.platformText}>
              {isWebVideo ? "Web Embed Stream" : "Self-Hosted Video File"}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {hasError ? (
        <View style={styles.failedContainer}>
          <AlertTriangle size={32} color={colors.error} style={{ marginBottom: 8 }} />
          <Text style={[styles.failedText, { color: colors.textPrimary }]}>Could not load walkthrough video</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setHasError(false);
              setLoading(true);
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1, position: "relative" }}>
          {isWebVideo ? (
            <WebView
              source={{ uri: embedUrl! }}
              style={{ flex: 1 }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => setHasError(true)}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
            />
          ) : (
            <Video
              source={{ uri: videoUrl }}
              posterSource={posterImage ? { uri: posterImage } : undefined}
              usePoster={!!posterImage}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={activated}
              useNativeControls
              style={{ flex: 1 }}
              onLoadStart={() => setLoading(true)}
              onLoad={() => setLoading(false)}
              onError={(err) => {
                console.error("expo-av video error:", err);
                setHasError(true);
              }}
            />
          )}
          {loading && (
            <View style={[styles.loaderOverlay, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
                Buffering video...
              </Text>
            </View>
          )}
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
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  failedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  failedText: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  errorCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
