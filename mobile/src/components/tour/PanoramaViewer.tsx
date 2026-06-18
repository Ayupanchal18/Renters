import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Image, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { AlertTriangle, Compass } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { radius, spacing } from "@shared/theme/tokens";
import AnimatedPressable from "../ui/AnimatedPressable";

interface PanoramaImage {
  url: string;
  label: string;
}

interface PanoramaViewerProps {
  panoramaImages?: Array<{ url: string; label: string } | string>;
}

export default function PanoramaViewer({ panoramaImages = [] }: PanoramaViewerProps) {
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Standardize the panorama images array
  const images: PanoramaImage[] = (panoramaImages || []).map((img, idx) => {
    if (typeof img === "string") {
      return { url: img, label: `Scene ${idx + 1}` };
    }
    return { url: img.url, label: img.label || `Scene ${idx + 1}` };
  });

  const activeImage = images[activeIndex];

  const loadScene = (index: number) => {
    const target = images[index];
    if (target && isReady) {
      setViewerLoading(true);
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "LOAD_SCENE",
          url: target.url,
          title: target.label,
        })
      );
    }
  };

  useEffect(() => {
    if (isReady && activeImage) {
      loadScene(activeIndex);
    }
  }, [activeIndex, isReady]);

  if (images.length === 0) {
    return (
      <View style={[styles.errorCard, { backgroundColor: `${colors.error}08`, borderColor: `${colors.error}33` }]}>
        <AlertTriangle size={24} color={colors.error} style={{ marginRight: 12 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
          No panorama images available for this tour.
        </Text>
      </View>
    );
  }

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "READY") {
        setIsReady(true);
      } else if (data.type === "LOADED") {
        setViewerLoading(false);
      } else if (data.type === "ERROR") {
        console.error("Pannellum error:", data.message);
        setViewerLoading(false);
        setHasError(true);
      }
    } catch (e) {
      console.error("onMessage parsing error:", e);
    }
  };

  // self-contained Pannellum HTML code
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Pannellum 360 Viewer</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"></script>
        <style>
            html, body, #panorama {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #0f172a;
                overflow: hidden;
            }
            .pnlm-control-bar {
                background-color: rgba(15, 23, 42, 0.75) !important;
                border-radius: 6px;
            }
            .pnlm-about-msg {
                display: none !important;
            }
        </style>
    </head>
    <body>
        <div id="panorama"></div>
        <script>
            var viewer = null;
            function loadScene(imgUrl, title) {
                try {
                    if (viewer) {
                        viewer.destroy();
                    }
                    viewer = pannellum.viewer('panorama', {
                        "type": "equirectangular",
                        "panorama": imgUrl,
                        "autoLoad": true,
                        "title": title || "",
                        "showZoomCtrl": false,
                        "showFullscreenCtrl": false,
                        "compass": false
                    });
                    
                    viewer.on('load', function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
                    });
                    viewer.on('error', function(err) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err }));
                    });
                } catch(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
                }
            }

            window.addEventListener('message', function(event) {
                try {
                    var message = JSON.parse(event.data);
                    if (message.type === 'LOAD_SCENE') {
                        loadScene(message.url, message.title);
                    }
                } catch (e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
                }
            });

            // signal ready
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.rootContainer}>
      <View style={[styles.viewerContainer, { borderColor: colors.border }]}>
        {hasError ? (
          <View style={styles.failedContainer}>
            <AlertTriangle size={32} color={colors.error} style={{ marginBottom: 8 }} />
            <Text style={[styles.failedText, { color: colors.textPrimary }]}>Failed to load 360° Panorama</Text>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setHasError(false);
                setViewerLoading(true);
                if (webViewRef.current) {
                  webViewRef.current.reload();
                }
              }}
            >
              <Text style={styles.retryBtnText}>Reload Viewer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1, position: "relative" }}>
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent }}
              style={{ flex: 1 }}
              onMessage={onMessage}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              bounces={false}
            />

            {viewerLoading && (
              <View style={[styles.loaderOverlay, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
                  Loading 360° Scene...
                </Text>
              </View>
            )}

            <View style={styles.compassBadge}>
              <Compass size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.compassText}>360° Panorama</Text>
            </View>
          </View>
        )}
      </View>

      {/* Native Thumbnail Strip Controller */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailList}
      >
        {images.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <Pressable
              key={idx}
              style={[
                styles.thumbnailWrapper,
                {
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => {
                if (idx !== activeIndex) {
                  setActiveIndex(idx);
                }
              }}
            >
              {item.url ? (
                <Image source={{ uri: item.url }} style={styles.thumbnailImage} resizeMode="cover" />
              ) : (
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.input }]}>
                  <Compass size={18} color={colors.textSecondary} />
                </View>
              )}
              <View
                style={[
                  styles.thumbnailLabelBar,
                  { backgroundColor: isActive ? colors.primary : "rgba(15, 23, 42, 0.75)" },
                ]}
              >
                <Text style={styles.thumbnailLabelText} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    width: "100%",
  },
  viewerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: "hidden",
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
  compassBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  compassText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
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
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  thumbnailList: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  thumbnailWrapper: {
    width: 100,
    height: 70,
    borderRadius: radius.md,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailLabelBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  thumbnailLabelText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
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
