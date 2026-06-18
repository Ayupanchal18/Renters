import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff, Wifi } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";

export default function NetworkWarning() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Check initial status
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isConnected !== null && isConnected !== state.isConnected) {
        if (!state.isConnected) {
          // Went offline
          setIsConnected(false);
          setShowBackOnline(false);
          showWarning();
        } else {
          // Came back online
          setIsConnected(true);
          setShowBackOnline(true);
          
          // Hide the "Back Online" message after 3 seconds
          setTimeout(() => {
            hideWarning();
          }, 3000);
        }
      } else {
        setIsConnected(state.isConnected);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  const showWarning = () => {
    Animated.spring(slideAnim, {
      toValue: insets.top, // Slide down just below the safe area
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  };

  const hideWarning = () => {
    Animated.timing(slideAnim, {
      toValue: -100, // Slide back up and hide
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBackOnline(false);
    });
  };

  // If connected initially and no transition to online happened, render nothing
  if (isConnected && !showBackOnline) {
    return null;
  }

  const isOffline = !isConnected;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isOffline ? colors.error : colors.success,
          paddingTop: insets.top ? 10 : 16,
        },
      ]}
    >
      <View style={styles.content}>
        {isOffline ? (
          <WifiOff size={20} color="#fff" />
        ) : (
          <Wifi size={20} color="#fff" />
        )}
        <Text style={styles.text}>
          {isOffline ? "No Internet Connection" : "Back Online"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 10,
    paddingHorizontal: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
