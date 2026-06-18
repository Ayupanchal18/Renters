import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../../theme/useTheme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreGaugeProps {
  score: number;
  label: string;
  maxScore?: number;
}

export default function ScoreGauge({ score, label, maxScore = 100 }: ScoreGaugeProps) {
  const { colors } = useTheme();

  // Circle path parameters
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2; // 46
  const circumference = 2 * Math.PI * radius; // ~289

  // Reanimated shared value for dash offset animation
  const progress = useSharedValue(circumference);

  useEffect(() => {
    const targetOffset = circumference - (circumference * Math.min(score, maxScore)) / maxScore;
    progress.value = withTiming(targetOffset, {
      duration: 1200,
      easing: Easing.out(Easing.quad),
    });
  }, [score, circumference, maxScore]);

  // Determine score color band
  let scoreColor = colors.error; // Default destructive
  let qualitativeLabel = "Car-Dependent";
  if (score >= 70) {
    scoreColor = colors.success;
    qualitativeLabel = score >= 90 ? "Walker's Paradise" : "Very Walkable";
  } else if (score >= 50) {
    scoreColor = "#f97316"; // Orange warning
    qualitativeLabel = "Somewhat Walkable";
  }

  // Bind animation properties to the circle
  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: progress.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Foreground animated progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedCircleProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} // Rotate so it starts at the top
          />
        </Svg>
        {/* Centered text display inside gauge */}
        <View style={styles.textOverlay}>
          <Text style={[styles.scoreText, { color: colors.textPrimary }]}>{score}</Text>
          <Text style={[styles.maxText, { color: colors.textSecondary }]}>/{maxScore}</Text>
        </View>
      </View>
      <Text style={[styles.gaugeLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[styles.qualitativeLabel, { color: scoreColor }]}>{qualitativeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  svgWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  textOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "900",
  },
  maxText: {
    fontSize: 12,
    fontWeight: "600",
    alignSelf: "flex-end",
    marginBottom: 2,
  },
  gaugeLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  qualitativeLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },
});
