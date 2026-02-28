import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useTheme } from '../../../theme/useTheme';

const TESTIMONIALS = [
  { id: '1', name: 'Rahul Sharma', role: 'Software Engineer', text: 'Renters made my house hunting in Bengaluru so smooth. Highly recommended!', avatar: 'https://i.pravatar.cc/150?u=rahul' },
  { id: '2', name: 'Priya Patel', role: 'Student', text: 'Found an amazing PG near my college in Mumbai within 2 days. The zero brokerage is a game changer.', avatar: 'https://i.pravatar.cc/150?u=priya' },
  { id: '3', name: 'Amit Verma', role: 'Designer', text: 'The verified listings give much needed peace of mind. Great experience!', avatar: 'https://i.pravatar.cc/150?u=amit' },
];

export default function Testimonials() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What Our Users Say</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {TESTIMONIALS.map(t => (
          <View key={t.id} style={styles.cardWrap}>
            <View style={styles.card}>
              <Text style={styles.quoteIcon}>"</Text>
              <Text style={styles.text}>{t.text}</Text>
              <View style={styles.profile}>
                <Image source={{ uri: t.avatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.role}>{t.role}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16, // shadow padding
  },
  cardWrap: {
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  card: {
    width: 300,
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : colors.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
  quoteIcon: {
    fontSize: 48,
    color: colors.primary + '33',
    fontWeight: '900',
    position: 'absolute',
    top: 10,
    right: 20,
    fontFamily: 'serif',
  },
  text: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
    zIndex: 1,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.input,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  role: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  }
});
