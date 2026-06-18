import React, { useMemo } from "react";
import { StyleSheet, Text, View, Linking, Pressable } from "react-native";
import { MapPin, Navigation, ExternalLink } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import { Property } from "../../../types/types";

interface Props {
  property: Property;
}

export default function PropertyLocation({ property }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  // Parse coordinates
  const parseCoordinates = () => {
    const mapLocation = property?.mapLocation;
    if (mapLocation && typeof mapLocation === 'string') {
      const parts = mapLocation.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    }
    
    const coords = property?.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      return { lat: coords[1], lng: coords[0] }; // GeoJSON is [lng, lat]
    }
    
    return null;
  };

  const coords = parseCoordinates();
  const addressParts = [
    property?.address,
    property?.locality,
    property?.city,
    property?.state,
    property?.pincode
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ') || 'Address not available';

  const handleGetDirections = () => {
    if (!coords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={20} color={colors.primary} />
        <Text style={styles.title}>Location</Text>
      </View>

      <View style={styles.addressBox}>
        <Text style={styles.addressLabel}>Address</Text>
        <Text style={styles.addressText}>{fullAddress}</Text>
      </View>

      {property?.landmark && (
        <View style={styles.landmarkBox}>
          <Navigation size={14} color={colors.primary} />
          <View>
            <Text style={styles.landmarkLabel}>Nearby Landmark</Text>
            <Text style={styles.landmarkText}>{property.landmark}</Text>
          </View>
        </View>
      )}

      {coords && (
        <Pressable style={styles.directionsBtn} onPress={handleGetDirections}>
          <Navigation size={18} color={colors.textPrimary} />
          <Text style={styles.directionsText}>Get Directions</Text>
          <ExternalLink size={14} color={colors.textSecondary} style={{ opacity: 0.5 }} />
        </Pressable>
      )}

      <View style={styles.grid}>
        {property?.locality && (
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Locality</Text>
            <Text style={styles.gridValue}>{property.locality}</Text>
          </View>
        )}
        {property?.city && (
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>City</Text>
            <Text style={styles.gridValue}>{property.city}</Text>
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
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  addressBox: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 20,
  },
  landmarkBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  landmarkLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  landmarkText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  directionsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
});
