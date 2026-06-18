import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Linking, ScrollView } from "react-native";
import { Car, Clock, MapPin, Navigation, Save, X } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../../../theme/useTheme";
import AppButton from "../../../components/ui/AppButton";

const DEPARTURE_TIMES = [
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
];

const STORAGE_KEY = "commute_preferences";

interface Props {
  propertyCoords?: { lat: number; lng: number } | null;
}

export default function CommuteCalculator({ propertyCoords }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("09:00");
  const [hasSavedDestination, setHasSavedDestination] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved) {
          const prefs = JSON.parse(saved);
          if (prefs.destination) {
            setDestination(prefs.destination);
            setHasSavedDestination(true);
          }
          if (prefs.departureTime) {
            setDepartureTime(prefs.departureTime);
          }
        }
      } catch (e) {
        console.error("Error loading commute preferences:", e);
      }
    };
    loadPrefs();
  }, []);

  const savePreferences = async () => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({
        destination,
        departureTime
      }));
      setHasSavedDestination(true);
    } catch (e) {
      console.error("Error saving commute preferences:", e);
    }
  };

  const clearSavedDestination = async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setDestination("");
      setHasSavedDestination(false);
    } catch (e) {
      console.error("Error clearing commute preferences:", e);
    }
  };

  const calculateCommute = () => {
    if (!destination.trim() || !propertyCoords) return;

    // Use property coordinates
    const origin = `${propertyCoords.lat},${propertyCoords.lng}`;
    const encodedDestination = encodeURIComponent(destination);
    
    // Google Maps directions URL
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodedDestination}&travelmode=driving`;

    savePreferences();
    Linking.openURL(mapsUrl);
  };

  if (!propertyCoords) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Car size={18} color={colors.primary} />
        <Text style={styles.title}>Commute Calculator</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.label}>Your destination (e.g., office address)</Text>
          <View style={styles.inputContainer}>
            <MapPin size={16} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="Enter office or destination address..."
              placeholderTextColor={colors.textSecondary}
            />
            {hasSavedDestination && (
              <Pressable onPress={clearSavedDestination} style={styles.clearBtn}>
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          {hasSavedDestination && (
            <View style={styles.savedHint}>
              <Save size={10} color={colors.primary} style={{ opacity: 0.7 }} />
              <Text style={styles.savedText}>Saved for future visits</Text>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Typical departure time</Text>
          <View style={styles.timeScrollContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
              {DEPARTURE_TIMES.map((time) => (
                <Pressable
                  key={time.value}
                  onPress={() => setDepartureTime(time.value)}
                  style={[
                    styles.timeChip,
                    departureTime === time.value && styles.timeChipActive
                  ]}
                >
                  <Clock size={12} color={departureTime === time.value ? "#fff" : colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[
                    styles.timeChipText,
                    departureTime === time.value && styles.timeChipTextActive
                  ]}>
                    {time.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <AppButton
          onPress={calculateCommute}
          disabled={!destination.trim()}
          style={styles.calcBtn}
        >
          <View style={styles.btnContent}>
            <Navigation size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Calculate Commute</Text>
          </View>
        </AppButton>

        <Text style={styles.footerInfo}>
          Opens Google Maps with directions and live traffic info
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  body: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 8,
  },
  savedHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  savedText: {
    fontSize: 10,
    color: colors.primary,
    opacity: 0.7,
  },
  timeScrollContainer: {
    marginHorizontal: -16,
  },
  timeScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  timeChipTextActive: {
    color: "#fff",
  },
  calcBtn: {
    marginTop: 8,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footerInfo: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
