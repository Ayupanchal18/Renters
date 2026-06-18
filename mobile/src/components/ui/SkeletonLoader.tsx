import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, ViewStyle, StyleProp } from 'react-native';

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion setting
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });

    // Animate if reduce motion is not enabled
    if (!reduceMotion) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#e2e8f0', // slate-200
          opacity: reduceMotion ? 0.5 : opacity,
        },
        style,
      ]}
    />
  );
}
