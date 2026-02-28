import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

interface PropertySkeletonProps {
  style?: ViewStyle;
}

export default function PropertySkeleton({ style }: PropertySkeletonProps) {
  const opactiy = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opactiy, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opactiy, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opactiy]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.imagePlaceholder, { opacity: opactiy }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.lineTarget, { opacity: opactiy, width: '75%', height: 20, marginBottom: 8 }]} />
        <Animated.View style={[styles.lineTarget, { opacity: opactiy, width: '50%', height: 14, marginBottom: 16 }]} />
        <View style={styles.grid}>
          <Animated.View style={[styles.boxTarget, { opacity: opactiy }]} />
          <Animated.View style={[styles.boxTarget, { opacity: opactiy }]} />
          <Animated.View style={[styles.boxTarget, { opacity: opactiy }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#e2e8f0', // slate-200
  },
  content: {
    padding: 16,
  },
  lineTarget: {
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  boxTarget: {
    flex: 1,
    height: 36,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
});
