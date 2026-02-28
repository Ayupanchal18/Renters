import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../../theme/useTheme';
import { MapPin, Navigation, Search } from 'lucide-react-native';

export default function HeroSearch({ onSearch }: { onSearch: (params: any) => void }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>('rent');
  const [locationStr, setLocationStr] = useState('');
  const [locating, setLocating] = useState(false);

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const readableStr = [place.city, place.region].filter(Boolean).join(', ');
        setLocationStr(readableStr);
      } else {
        setLocationStr(`${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}`);
      }
    } catch (err) {
      console.warn('Geolocation failed', err);
    } finally {
      setLocating(false);
    }
  };

  const submitSearch = () => {
    onSearch({ type: activeTab, location: locationStr });
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        
        {/* Tabs */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabs}>
            <Pressable 
              style={[styles.tab, activeTab === 'rent' && styles.activeTab]}
              onPress={() => setActiveTab('rent')}
            >
              <Text style={[styles.tabText, activeTab === 'rent' && styles.activeTabText]}>Rent</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'buy' && styles.activeTab]}
              onPress={() => setActiveTab('buy')}
            >
              <Text style={[styles.tabText, activeTab === 'buy' && styles.activeTabText]}>Buy</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.fieldLabel}>LOCATION</Text>
          <View style={styles.inputWrap}>
            <MapPin size={20} color="#6B7280" style={styles.icon} />
            <TextInput
              placeholder="City, locality or landmark"
              style={styles.input}
              value={locationStr}
              onChangeText={setLocationStr}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.divider} />
            <Pressable onPress={handleGetCurrentLocation} style={styles.locateBtn}>
              {locating ? (
                <ActivityIndicator size="small" color="#2B50FF" />
              ) : (
                <View style={styles.locateInner}>
                  <Navigation size={16} color="#0D3B66" style={{ marginRight: 6 }} />
                  <Text style={styles.locateText}>Use My Location</Text>
                </View>
              )}
            </Pressable>
          </View>

          <Pressable onPress={submitSearch} style={styles.searchBtnWrap}>
            <View style={styles.searchBtn}>
              <Search size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.searchBtnText}>Search Properties</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginTop: -30, // Pull up over hero image
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  card: {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  tabsWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#334155' : '#F3F4F6',
    borderRadius: 30, // Highly rounded pill
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 26, // Inner pill
  },
  activeTab: {
    backgroundColor: '#0066FF', // Bright blue from mockup
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: isDark ? '#94A3B8' : '#4B5563',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: isDark ? '#94A3B8' : '#4B5563',
    marginBottom: -4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#334155' : '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: isDark ? '#475569' : '#E5E7EB',
    height: 54,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: isDark ? '#FFFFFF' : '#111827',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: isDark ? '#475569' : '#E5E7EB',
    marginHorizontal: 12,
  },
  locateBtn: {
    justifyContent: 'center',
  },
  locateInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locateText: {
    fontSize: 13,
    color: '#0D3B66', // Deep blue
    fontWeight: '600',
  },
  searchBtnWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchBtn: {
    height: 56,
    backgroundColor: '#3B5AFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
