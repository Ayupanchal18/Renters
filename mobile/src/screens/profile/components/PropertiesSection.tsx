import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator, Image } from "react-native";
import { Building2, Eye, MapPin, MoreVertical, ToggleLeft, ToggleRight, Trash2, Calendar, Users, TrendingUp, Plus, Home } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../theme/useTheme";
import { User } from "../../../types/types";
import { getAccessToken } from "../../../features/auth/services/tokenStorage";
import { env } from "../../../config/env";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";

type Property = {
  _id: string;
  title: string;
  monthlyRent?: number;
  city?: string;
  status: 'active' | 'inactive' | 'blocked';
  photos?: string[];
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  propertyType?: string;
  bedrooms?: number;
  furnishing?: string;
};

type Props = {
  user: User | null;
};

export default function PropertiesSection({ user }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<Record<string, string>>({});
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const fetchProperties = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${env.apiBaseUrl}/api/properties/my-listings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch properties');
      }

      setProperties(data.properties || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user, fetchProperties]);

  const handleToggleStatus = useCallback(async (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    setOperationLoading(prev => ({ ...prev, [propertyId]: 'toggle' }));
    
    try {
      const token = await getAccessToken();
      const response = await fetch(`${env.apiBaseUrl}/api/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update property status');
      }

      setProperties(prev => 
        prev.map(prop => 
          prop._id === propertyId ? { ...prop, status: newStatus as any } : prop
        )
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update property status');
    } finally {
      setOperationLoading(prev => {
        const newState = { ...prev };
        delete newState[propertyId];
        return newState;
      });
    }
  }, []);

  const handleDeleteProperty = useCallback(async (propertyId: string) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setOperationLoading(prev => ({ ...prev, [propertyId]: 'delete' }));
            
            try {
              const token = await getAccessToken();
              const response = await fetch(`${env.apiBaseUrl}/api/properties/${propertyId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {
                throw new Error('Failed to delete property');
              }

              setProperties(prev => prev.filter(prop => prop._id !== propertyId));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete property');
            } finally {
              setOperationLoading(prev => {
                const newState = { ...prev };
                delete newState[propertyId];
                return newState;
              });
            }
          }
        }
      ]
    );
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'inactive': return colors.warning;
      case 'blocked': return colors.error;
      default: return colors.textSecondary;
    }
  }, [colors]);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }, []);

  const PropertyCard = React.memo(({ property }: { property: Property }) => {
    const daysListed = Math.floor((new Date().getTime() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)) || 0;
    
    return (
      <View style={styles.propertyCard}>
        <View style={styles.propertyHeader}>
          {property.photos && property.photos[0] ? (
            <Image
              source={{ uri: property.photos[0] }}
              style={styles.propertyImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Building2 size={20} color={colors.textSecondary} />
            </View>
          )}
          
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {property.title}
            </Text>
            
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.primary} />
              <Text style={styles.locationText}>{property.city || "Unknown"}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>₹{property.monthlyRent?.toLocaleString() || 'N/A'}</Text>
              <Text style={styles.priceUnit}>/mo</Text>
            </View>
          </View>
          
          <View style={styles.propertyActions}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(property.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
                {property.status}
              </Text>
            </View>
            
            <Pressable
              style={styles.moreButton}
              onPress={() => {
                Alert.alert(
                  'Property Actions',
                  'Choose an action',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: property.status === 'active' ? 'Deactivate' : 'Activate',
                      onPress: () => handleToggleStatus(property._id, property.status)
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => handleDeleteProperty(property._id)
                    }
                  ]
                );
              }}
            >
              {operationLoading[property._id] ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <MoreVertical size={16} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>
        </View>
        
        <View style={styles.propertyStats}>
          <View style={styles.statItem}>
            <Eye size={12} color={colors.primary} />
            <Text style={styles.statText}>{property.views || 0}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Users size={12} color={colors.error} />
            <Text style={styles.statText}>{property.favoritesCount || 0}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Calendar size={12} color={colors.warning} />
            <Text style={styles.statText}>{daysListed}d</Text>
          </View>
          
          {property.views && property.views > 50 && (
            <View style={styles.hotBadge}>
              <TrendingUp size={10} color={colors.success} />
              <Text style={styles.hotText}>Hot</Text>
            </View>
          )}
        </View>
        
        {operationLoading[property._id] && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>
              {operationLoading[property._id] === 'toggle' ? 'Updating...' : 'Deleting...'}
            </Text>
          </View>
        )}
      </View>
    );
  });

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Building2 color={colors.primary} size={22} />
        <Text style={styles.sectionTitle}>Your Properties</Text>
        {properties.length > 0 && (
          <Text style={styles.countBadge}>{properties.length}</Text>
        )}
      </View>
      
      <View style={styles.card}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading properties...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchProperties} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : properties.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertiesScroll}>
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Building2 size={28} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No properties yet</Text>
            <Text style={styles.emptySubtitle}>Start by posting your first property</Text>
            <Pressable 
              style={styles.postButton}
              onPress={() => navigation.navigate("PostProperty")}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2} />
              <Text style={styles.postButtonText}>Post Property</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  propertiesScroll: {
    padding: 16,
    gap: 12,
  },
  propertyCard: {
    width: 280,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  propertyHeader: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  propertyInfo: {
    flex: 1,
    gap: 4,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  propertyActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  moreButton: {
    padding: 4,
  },
  propertyStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.input,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hotText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.background}90`,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface, // Use surface color instead
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  postButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});