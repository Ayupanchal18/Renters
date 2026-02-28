import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/useTheme';

const FEATURES = [
  { icon: '🛡️', title: 'Verified Listings', desc: 'Every property is hand-verified by our team.' },
  { icon: '💰', title: 'Zero Brokerage', desc: 'Connect directly with owners to save money.' },
  { icon: '🤝', title: 'Trusted Owners', desc: 'Genuine landlords with verified profiles.' },
  { icon: '⚡', title: 'Fast Processing', desc: 'Streamlined agreements and quick move-ins.' },
];

export default function WhyChooseUs() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Why Choose Us</Text>
      <View style={styles.grid}>
        {FEATURES.map((feat, idx) => (
          <View key={idx} style={styles.cardWrap}>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{feat.icon}</Text>
              </View>
              <Text style={styles.featTitle}>{feat.title}</Text>
              <Text style={styles.featDesc}>{feat.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardWrap: {
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  card: {
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : colors.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + (isDark ? '33' : '1A'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  featTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  featDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  }
});
