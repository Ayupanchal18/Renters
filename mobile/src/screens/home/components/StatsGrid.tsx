import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/useTheme';
import { Star } from 'lucide-react-native';

const STATS = [
  { value: '10K+', label: 'Active Listings' },
  { value: '50K+', label: 'Happy Renters' },
  { value: '100+', label: 'Cities Covered' },
  { value: '4.8', label: 'App Rating' },
];

export default function StatsGrid() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.container}>
      {STATS.map((stat, idx) => (
        <View key={idx} style={styles.statBox}>
          {stat.label === 'App Rating' ? (
            <View style={styles.ratingRow}>
              <Star size={22} fill="#F59E0B" color="#F59E0B" style={styles.star} />
              <Text style={[styles.value, styles.ratingValue]}>{stat.value}</Text>
              <Star size={22} fill="#F59E0B" color="#F59E0B" style={styles.star} />
            </View>
          ) : (
            <Text style={styles.value}>{stat.value}</Text>
          )}
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 32,
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: isDark ? '#94A3B8' : '#4B5563',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingValue: {
    color: isDark ? '#FFFFFF' : '#0D3B66',
    marginHorizontal: 8,
    marginBottom: 0,
  },
  star: {
    marginTop: -2,
  }
});
