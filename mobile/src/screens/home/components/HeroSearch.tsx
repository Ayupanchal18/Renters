import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useTheme } from '../../../theme/useTheme';
import { MapPin, Navigation, Search, ChevronDown, Mic } from 'lucide-react-native';

// Safe lazy load — expo-speech-recognition requires a native rebuild to be available.
// Gracefully degrade if the module isn't linked in the current build.
let SpeechModule: any = null;
let useSpeechRecognitionEvent: (event: string, cb: (e: any) => void) => void = () => {};
try {
  const mod = require('expo-speech-recognition');
  SpeechModule = mod.ExpoSpeechRecognitionModule ?? null;
  if (mod.useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
  }
} catch (_) {
  // Native module not linked in this build — voice search will show a rebuild notice
}

// Property type options matching web functionality
const PROPERTY_TYPE_OPTIONS = [
  { value: 'room', label: 'Room' },
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'house', label: 'House' },
  { value: 'pg', label: 'PG (Paying Guest)' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'commercial', label: 'Commercial Space' }
];

// Location suggestions (simplified for mobile)
const getLocationSuggestions = (input: string) => {
  const suggestions = [
    'Mumbai, Maharashtra',
    'Delhi, NCR',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Pune, Maharashtra',
    'Kolkata, West Bengal',
    'Ahmedabad, Gujarat',
    'Jaipur, Rajasthan',
    'Surat, Gujarat'
  ];
  
  if (!input || input.length < 2) return [];
  
  return suggestions.filter(location => 
    location.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 5);
};

// Search parameter validation (simplified mobile version)
const validateSearchParameters = (params: any) => {
  const errors: any = {};
  let isValid = true;
  
  // Check if we have at least one search criterion
  const hasLocation = params.location && params.location.trim();
  const hasPropertyType = params.propertyType && params.propertyType.trim();
  const hasKeywords = params.keywords && params.keywords.trim();
  
  if (!hasLocation && !hasPropertyType && !hasKeywords) {
    errors.general = 'Please provide at least a location, property type, or keywords to search';
    isValid = false;
  }
  
  // Validate location length
  if (hasLocation && params.location.trim().length < 2) {
    errors.location = 'Location must be at least 2 characters';
    isValid = false;
  }
  
  // Validate keywords length
  if (hasKeywords && params.keywords.trim().length < 2) {
    errors.keywords = 'Keywords must be at least 2 characters';
    isValid = false;
  }
  
  return {
    isValid,
    errors,
    normalized: isValid ? {
      location: { formatted: params.location || '' },
      propertyType: params.propertyType || '',
      keywords: params.keywords || ''
    } : null
  };
};

// Convert to API payload
const convertToApiPayload = (normalized: any) => {
  return {
    q: normalized.keywords || '',
    location: normalized.location?.formatted || '',
    city: normalized.location?.formatted || '',
    propertyType: normalized.propertyType || '',
    category: normalized.propertyType || ''
  };
};

export default function HeroSearch({ onSearch }: { onSearch: (params: any) => void }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>('rent');
  const [locationStr, setLocationStr] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [keywords, setKeywords] = useState('');
  const [locating, setLocating] = useState(false);
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // Pulsing ring animation for the mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  // Start/stop the pulsing ring when listening state changes
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseOpacity.stopAnimation();
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.6);
    }
  }, [isListening]);

  // Listen for recognition results
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) {
      setLocationStr(transcript);
      setShowLocationSuggestions(transcript.length > 0);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
  });

  const handleVoiceSearch = async () => {
    if (!SpeechModule) {
      alert('Voice search requires a fresh app build. Please rebuild the APK to enable this feature.');
      return;
    }
    if (isListening) {
      SpeechModule.stop();
      setIsListening(false);
      return;
    }
    const { status } = await SpeechModule.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Microphone permission is required for voice search');
      return;
    }
    setIsListening(true);
    SpeechModule.start({
      lang: 'en-IN',
      interimResults: true,
      maxAlternatives: 1,
    });
  };

  // Animated value: 0 = Rent, 1 = Buy
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchTab = useCallback((tab: 'rent' | 'buy') => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === 'rent' ? 0 : 1,
      useNativeDriver: true,
      tension: 68,
      friction: 11,
    }).start();
  }, [slideAnim]);

  // Pill slides left (0) or right (half the bar width)
  const pillTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabBarWidth / 2],
  });

  // Cross-fade: Rent text goes dim when Buy is active and vice-versa
  const rentTextOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
  });
  const buyTextOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

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
    const searchParams = {
      location: locationStr.trim(),
      propertyType: propertyType,
      keywords: keywords.trim()
    };
    
    const validation = validateSearchParameters(searchParams);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.errors.general) {
        alert(validation.errors.general);
      }
      return;
    }
    
    // Clear errors on successful validation
    setErrors({});
    
    const searchPayload = convertToApiPayload(validation.normalized);
    
    // Enhanced search data with proper structure
    onSearch({ 
      type: activeTab, 
      searchData: {
        ...searchPayload,
        listingType: activeTab
      }
    });
  };

  return (
    <View style={styles.cardContainer}>
      <BlurView
        intensity={120}
        tint={isDark ? "dark" : "light"}
        style={styles.cardBlur}
      >
        <View style={styles.card}>
        
        {/* Tabs */}
        <View style={styles.tabsWrap}>
          <View
            style={styles.tabs}
            onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
          >
            {/* Sliding blue pill — absolute, animates between the two tabs */}
            <Animated.View
              style={[
                styles.slidingPill,
                { width: tabBarWidth / 2, transform: [{ translateX: pillTranslateX }] },
              ]}
            />

            {/* Rent tab */}
            <Pressable style={styles.tab} onPress={() => switchTab('rent')}>
              <Animated.Text
                style={[
                  styles.tabText,
                  { opacity: rentTextOpacity },
                  activeTab === 'rent' && styles.activeTabText,
                ]}
              >
                Rent
              </Animated.Text>
            </Pressable>

            {/* Buy tab */}
            <Pressable style={styles.tab} onPress={() => switchTab('buy')}>
              <Animated.Text
                style={[
                  styles.tabText,
                  { opacity: buyTextOpacity },
                  activeTab === 'buy' && styles.activeTabText,
                ]}
              >
                Buy
              </Animated.Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          {/* Location Field */}
          <Text style={styles.fieldLabel}>LOCATION</Text>
          <View style={styles.inputWrap}>
            <MapPin size={20} color="#6B7280" style={styles.icon} />
            <TextInput
              placeholder="City, locality or landmark"
              style={styles.input}
              value={locationStr}
              onChangeText={(text) => {
                setLocationStr(text);
                setShowLocationSuggestions(text.length > 0);
                if (errors.location) setErrors((prev: any) => ({ ...prev, location: '' }));
              }}
              placeholderTextColor="#9CA3AF"
            />
            {/* GPS locate button */}
            <Pressable onPress={handleGetCurrentLocation} style={styles.locateIconBtn}>
              {locating ? (
                <ActivityIndicator size="small" color="#0066FF" />
              ) : (
                <Navigation size={18} color="#0066FF" />
              )}
            </Pressable>
            {/* Voice search button */}
            <Pressable onPress={handleVoiceSearch} style={styles.micBtn}>
              {/* Pulsing ring — only visible while listening */}
              {isListening && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                  ]}
                />
              )}
              <Mic size={18} color={isListening ? '#EF4444' : '#0066FF'} />
            </Pressable>
          </View>
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
          
          {/* Location Suggestions */}
          {showLocationSuggestions && locationStr && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
                {getLocationSuggestions(locationStr).map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setLocationStr(suggestion);
                      setShowLocationSuggestions(false);
                      if (errors.location) setErrors((prev: any) => ({ ...prev, location: '' }));
                    }}
                  >
                    <MapPin size={16} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Property Type Field */}
          <Text style={styles.fieldLabel}>PROPERTY TYPE</Text>
          <Pressable
            style={styles.dropdownButton}
            onPress={() => setShowPropertyTypeDropdown(!showPropertyTypeDropdown)}
          >
            <Text style={[styles.dropdownText, propertyType ? styles.dropdownTextSelected : null]}>
              {propertyType ? PROPERTY_TYPE_OPTIONS.find(opt => opt.value === propertyType)?.label : 'All Types'}
            </Text>
            <ChevronDown 
              size={20} 
              color="#6B7280" 
              style={[styles.dropdownIcon, showPropertyTypeDropdown && styles.dropdownIconRotated]} 
            />
          </Pressable>
          
          {/* Property Type Dropdown */}
          {showPropertyTypeDropdown && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPropertyType('');
                    setShowPropertyTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>All Types</Text>
                </Pressable>
                {PROPERTY_TYPE_OPTIONS.map((option, index) => (
                  <Pressable
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPropertyType(option.value);
                      setShowPropertyTypeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Keywords Field */}
          <Text style={styles.fieldLabel}>KEYWORDS</Text>
          <View style={styles.inputWrap}>
            <Search size={20} color="#6B7280" style={styles.icon} />
            <TextInput
              placeholder="Amenities, features..."
              style={styles.input}
              value={keywords}
              onChangeText={(text) => {
                setKeywords(text);
                if (errors.keywords) setErrors((prev: any) => ({ ...prev, keywords: '' }));
              }}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.keywords && (
            <Text style={styles.errorText}>{errors.keywords}</Text>
          )}

          <Pressable onPress={submitSearch} style={styles.searchBtnWrap}>
            <View style={styles.searchBtn}>
              <Search size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.searchBtnText}>Search Properties</Text>
            </View>
          </Pressable>
        </View>
        </View>
      </BlurView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginTop: -30, // Pull up over hero image
    borderRadius: 24,
    overflow: 'hidden',
    // Multi-layer shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.45 : 0.22,
    shadowRadius: 28,
    elevation: 16,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    // More transparent so hero image bleeds through the blur
    backgroundColor: isDark
      ? 'rgba(10, 18, 40, 0.45)'
      : 'rgba(240, 243, 255, 0.45)',
    // Crisp glass border that catches light
    borderWidth: 1.5,
    borderColor: isDark
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(255, 255, 255, 0.85)',
  },
  tabsWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabs: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    // Frosted glass pill — same transparency tier as the card
    backgroundColor: isDark
      ? 'rgba(30, 41, 59, 0.50)'
      : 'rgba(255, 255, 255, 0.50)',
    borderRadius: 30,
    padding: 4,
    // Top-edge highlight gives the classic glass "shine" look
    borderWidth: 1,
    borderTopColor: isDark
      ? 'rgba(255, 255, 255, 0.22)'
      : 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(209, 213, 219, 0.40)',
    borderLeftColor: isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.70)',
    borderRightColor: isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.70)',
  },
  // Sliding animated pill — sits behind the tab text labels
  slidingPill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    // Soft blue glow
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 24,
    // Must be above the sliding pill
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#CBD5E1' : '#374151',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    padding: 14, // Reduced from 16
    gap: 10, // Reduced from 12
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    // Darker, higher-contrast label to anchor each section
    color: isDark ? '#CBD5E1' : '#374151',
    marginBottom: -2,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    // Layer 2: semi-transparent so card bg still shows through
    backgroundColor: isDark
      ? 'rgba(30, 41, 59, 0.65)'
      : 'rgba(255, 255, 255, 0.65)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(148, 163, 184, 0.25)'
      : 'rgba(209, 213, 219, 0.80)',
    height: 48,
    // Subtle inset-style shadow to make it look recessed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.30 : 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14, // Reduced from 15
    color: isDark ? '#FFFFFF' : '#111827',
  },
  locateIconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  micBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    // Subtle left divider to visually separate from the GPS button
    borderLeftWidth: 1,
    borderLeftColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    paddingLeft: 4,
  },
  pulseRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EF4444',
    opacity: 0.4,
  },
  // Property Type Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Layer 2: same opacity as inputs for consistent tier
    backgroundColor: isDark
      ? 'rgba(30, 41, 59, 0.88)'
      : 'rgba(255, 255, 255, 0.88)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(148, 163, 184, 0.25)'
      : 'rgba(209, 213, 219, 0.80)',
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.30 : 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#9CA3AF',
  },
  dropdownTextSelected: {
    color: isDark ? '#FFFFFF' : '#111827',
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownContainer: {
    // Layer 3: most opaque — pops clearly above inputs and card
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.97)'
      : 'rgba(255, 255, 255, 0.97)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: isDark
      ? 'rgba(99, 102, 241, 0.35)'
      : 'rgba(99, 102, 241, 0.20)',
    maxHeight: 220,
    marginTop: 6,
    // Elevated shadow so dropdown floats above card
    shadowColor: isDark ? '#6366F1' : '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.14,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
    backgroundColor: 'transparent',
  },
  dropdownItemFirst: {
    // Top item visually anchors the list with a subtle accent top border
    borderTopWidth: 0,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#E2E8F0' : '#1F2937',
  },
  // Location Suggestions Styles
  suggestionsContainer: {
    // Same Layer 3 treatment as dropdown
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.97)'
      : 'rgba(255, 255, 255, 0.97)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: isDark
      ? 'rgba(99, 102, 241, 0.35)'
      : 'rgba(99, 102, 241, 0.20)',
    maxHeight: 160,
    marginTop: 6,
    shadowColor: isDark ? '#6366F1' : '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.14,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 160,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
  },
  suggestionText: {
    fontSize: 14,
    color: isDark ? '#FFFFFF' : '#111827',
    flex: 1,
  },
  // Error Text Style
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  searchBtnWrap: {
    marginTop: 6, // Reduced from 8
    borderRadius: 14, // Reduced from 16
    overflow: 'hidden',
  },
  searchBtn: {
    height: 50, // Reduced from 56
    backgroundColor: '#3B5AFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15, // Reduced from 16
    fontWeight: '600',
  }
});
