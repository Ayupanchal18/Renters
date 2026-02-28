import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { useTheme } from '../../../theme/useTheme';

const CITIES = [
  { id: '1', name: 'Mumbai', count: '5.2k+ Properties', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=500&auto=format&fit=crop&q=60' },
  { id: '2', name: 'Bengaluru', count: '4.8k+ Properties', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&auto=format&fit=crop&q=60' },
  { id: '3', name: 'Delhi', count: '6.1k+ Properties', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&auto=format&fit=crop&q=60' },
  { id: '4', name: 'Pune', count: '3.4k+ Properties', image: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=500&auto=format&fit=crop&q=60' },
];

export default function BrowseByCity({ onCityPress }: { onCityPress: (city: string) => void }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Popular Cities</Text>
        <Text style={styles.subtitle}>Find homes in the most happening cities</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {CITIES.map(city => (
          <Pressable key={city.id} onPress={() => onCityPress(city.name)} style={styles.cardWrap}>
            <View style={styles.card}>
              <ImageBackground source={{ uri: city.image }} style={styles.image} imageStyle={styles.imageStyle}>
                <View style={styles.overlay}>
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.propertyCount}>{city.count}</Text>
                </View>
              </ImageBackground>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    marginTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8, // for shadow
  },
  cardWrap: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  card: {
    width: 150,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 24,
  },
  overlay: {
    padding: 16,
    paddingTop: 40, // Fade effect naturally done by adding darker background at bottom
    backgroundColor: 'rgba(0,0,0,0.4)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cityName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  propertyCount: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  }
});
