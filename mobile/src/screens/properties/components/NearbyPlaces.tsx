import React, { useState, useEffect, useMemo } from "react"; 
import { StyleSheet, Text, View, ActivityIndicator, Pressable, ScrollView } from "react-native";
import { MapPin, RefreshCw, AlertCircle } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import { nearbyService, Amenity } from "../../../features/properties/services/nearbyService";
import { Property } from "../../../types/types";

// Dynamic icon mapping since we don't have the full lucide set imported statically
// We'll use MapPin as default or a simple Emoji/Text if needed
const getAmenityEmoji = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('school') || t.includes('university')) return '🎓';
  if (t.includes('hospital') || t.includes('health') || t.includes('clinic')) return '🏥';
  if (t.includes('restaurant') || t.includes('food') || t.includes('cafe')) return '🍴';
  if (t.includes('mall') || t.includes('shop')) return '🛍️';
  if (t.includes('bank') || t.includes('atm')) return '💳';
  if (t.includes('park')) return '🌳';
  if (t.includes('gym')) return '💪';
  if (t.includes('station') || t.includes('bus') || t.includes('train')) return '🚉';
  return '📍';
};

interface Props {
  property: Property;
  location?: string;
}

export default function NearbyPlaces({ property, location }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [places, setPlaces] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: any = null;

      // Try coordinates from mapLocation string
      if (property?.mapLocation) {
        const parts = property.mapLocation.split(',').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          data = await nearbyService.getNearbyAmenities({ lat: parts[0], lng: parts[1] });
        }
      }

      // Try location.coordinates array
      if (!data?.success && property?.location?.coordinates?.length === 2) {
        const [lng, lat] = property.location.coordinates;
        data = await nearbyService.getNearbyAmenities({ lat, lng });
      }

      // Fallback to address
      if (!data?.success) {
        data = await nearbyService.getNearbyAmenitiesByAddress(
          property.address,
          property.city || location
        );
      }

      if (data?.success && data.amenities?.length > 0) {
        setPlaces(data.amenities);
      } else {
        setError(data?.error || "No nearby places found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load nearby places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [property, location]);

  const displayLocation = property.city || location || "This Area";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.locationName}>{displayLocation}</Text>
          <Text style={styles.subtitle}>Nearby Places</Text>
        </View>
        {error && !loading && (
          <Pressable onPress={fetchNearby} style={styles.retryBtn}>
            <RefreshCw size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Finding nearby places...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerPad}>
            <AlertCircle size={24} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {places.map((place, idx) => (
              <View key={idx} style={styles.item}>
                <View style={styles.iconContainer}>
                  <Text style={styles.emoji}>{getAmenityEmoji(place.type)}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.itemDetail}>{place.type} • {place.distance}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  retryBtn: {
    padding: 8,
  },
  body: {
    padding: 16,
  },
  centerPad: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fbfcfd",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? colors.border : "#f1f5f9",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emoji: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
