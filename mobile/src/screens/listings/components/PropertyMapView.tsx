import React, { useRef, useEffect, useState, memo, useMemo } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { MapPin, Navigation, Bed, Bath, ArrowRight, X } from 'lucide-react-native';
import { useTheme } from '../../../theme/useTheme';
import type { Property } from '../../../types/types';

interface PropertyMapViewProps {
  properties: Property[];
  onPropertyPress: (property: Property) => void;
  type: 'rent' | 'buy';
}

const PropertyMapView = ({ properties, onPropertyPress, type }: PropertyMapViewProps) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const themeColor = type === 'buy' ? colors.success : colors.primary;

  // 1. Helper Functions
  const getCoords = (p: Property) => {
    if (p.location?.coordinates && Array.isArray(p.location.coordinates) && p.location.coordinates.length === 2) {
      return { latitude: Number(p.location.coordinates[1]), longitude: Number(p.location.coordinates[0]) };
    }
    if (p.mapLocation && typeof p.mapLocation === 'string') {
      const parts = p.mapLocation.split(',').map(v => parseFloat(v.trim()));
      if (parts.length === 2) return { latitude: parts[0], longitude: parts[1] };
    }
    const pAny = p as any;
    if (pAny.latitude !== undefined && pAny.longitude !== undefined) {
      return { latitude: Number(pAny.latitude), longitude: Number(pAny.longitude) };
    }
    if (pAny.lat !== undefined && pAny.lng !== undefined) {
      return { latitude: Number(pAny.lat), longitude: Number(pAny.lng) };
    }
    return null;
  };

  const validProperties = properties.filter(p => getCoords(p) !== null);
  const selectedProperty = validProperties.find(p => p._id === selectedPropertyId);

  const formatPrice = (p: Property) => {
    const price = type === 'buy' ? p.sellingPrice : p.monthlyRent;
    if (!price) return 'N/A';
    if (price >= 10000000) return `${(price/10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `${(price/100000).toFixed(1)}L`;
    return `₹${price.toLocaleString()}`;
  };

  // 2. Effects
  useEffect(() => {
    if (validProperties.length > 0) {
      setTracksViewChanges(true);
      const timer = setTimeout(() => setTracksViewChanges(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [validProperties.length]);

  useEffect(() => {
    if (validProperties.length > 0 && mapRef.current) {
      const coords = validProperties.map(p => getCoords(p)).filter(c => c !== null) as {latitude: number, longitude: number}[];
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
          animated: true,
        });
      }
    }
  }, [validProperties.length]);

  const handleMarkerPress = (property: Property) => {
    setSelectedPropertyId(property._id);
    setShowOverlay(true);
    
    const coords = getCoords(property);
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    }

    const index = validProperties.findIndex(p => p._id === property._id);
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        provider={PROVIDER_GOOGLE}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        initialRegion={{
            latitude: 20.5937,
            longitude: 78.9629,
            latitudeDelta: 15,
            longitudeDelta: 15,
        }}
      >
        {!isDark && (
          <UrlTile 
            urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />
        )}
        {validProperties.map((p) => {
          const coords = getCoords(p);
          if (!coords) return null;
          const isSelected = selectedPropertyId === p._id;

          return (
            <Marker
              key={p._id}
              coordinate={coords}
              onPress={() => handleMarkerPress(p)}
              tracksViewChanges={tracksViewChanges}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={isSelected ? 999 : 100}
            >
              <View style={styles.svgMarkerContainer}>
                <View style={[
                  styles.markerPriceBubble, 
                  { backgroundColor: isSelected ? themeColor : (isDark ? colors.surface : 'rgba(255,255,255,0.95)'), borderColor: themeColor }
                ]}>
                   <Text style={[styles.markerPriceText, { color: isSelected ? '#fff' : themeColor }]}>
                     {formatPrice(p)}
                   </Text>
                </View>

                <G opacity={isSelected ? 1 : 0.9}>
                  <View style={[styles.pinShadow, isSelected && styles.pinShadowSelected]}>
                    <Svg width={isSelected ? 60 : 48} height={isSelected ? 80 : 64} viewBox="0 0 384 512">
                      <Path
                        d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"
                        fill={themeColor}
                      />
                      <Circle cx="192" cy="192" r="100" fill={isDark ? colors.background : "white"} />
                      <Circle cx="192" cy="192" r="60" fill={themeColor} />
                    </Svg>
                  </View>
                </G>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selectedProperty && showOverlay && (
        <View style={styles.webOverlayCard}>
           <Pressable style={styles.closeOverlay} onPress={() => setShowOverlay(false)}>
             <X size={16} color="#fff" />
           </Pressable>
           
           <View style={styles.overlayImageContainer}>
             <Image 
               source={{ uri: selectedProperty.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400' }} 
               style={styles.overlayImage} 
             />
             <View style={styles.overlayGradient} />
             <View style={styles.overlayTextContent}>
                <Text style={styles.overlayTitle} numberOfLines={1}>{selectedProperty.title}</Text>
                <View style={styles.overlayLocRow}>
                   <MapPin size={10} color="rgba(255,255,255,0.8)" />
                   <Text style={styles.overlayLoc} numberOfLines={1}>{selectedProperty.address || selectedProperty.city}</Text>
                </View>
             </View>
           </View>

           <View style={styles.overlayDetailsContent}>
              <View style={styles.overlaySpecs}>
                 <View style={styles.specItem}>
                    <Bed size={14} color={themeColor} />
                    <Text style={styles.specText}>{selectedProperty.bedrooms} Bed</Text>
                 </View>
                 <View style={styles.specItem}>
                    <Bath size={14} color={themeColor} />
                    <Text style={styles.specText}>{selectedProperty.bathrooms} Bath</Text>
                 </View>
              </View>

              <View style={styles.overlayBottomRow}>
                 <View>
                    <Text style={styles.priceLabelWeb}>{type === 'buy' ? 'Selling Price' : 'Monthly Rent'}</Text>
                    <Text style={[styles.priceValWeb, { color: themeColor }]}>
                      ₹{formatPrice(selectedProperty)}{type === 'rent' ? '/mo' : ''}
                    </Text>
                 </View>
                 <Pressable 
                   style={[styles.viewDetailsBtn, { backgroundColor: themeColor }]}
                   onPress={() => onPropertyPress(selectedProperty)}
                 >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <ArrowRight size={14} color="#fff" />
                 </Pressable>
              </View>
           </View>
        </View>
      )}

      <View style={styles.bottomListContainer}>
         <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Properties ({validProperties.length})</Text>
         </View>
         <FlatList
            ref={listRef}
            data={validProperties}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item }) => {
              const isSelected = selectedPropertyId === item._id;
              return (
                <Pressable 
                  onPress={() => handleMarkerPress(item)}
                  style={[
                    styles.hCard, 
                    isSelected && { borderColor: themeColor, backgroundColor: themeColor + '20' }
                  ]}
                >
                  <Image source={{ uri: item.photos?.[0] }} style={styles.hCardImage} />
                  <View style={styles.hCardInfo}>
                    <Text style={styles.hCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.hCardPrice, { color: themeColor }]}>{formatPrice(item)}</Text>
                  </View>
                </Pressable>
              );
            }}
         />
      </View>

      {validProperties.length === 0 && (
         <View style={styles.noLocContainer}>
            <View style={styles.noLocCard}>
               <MapPin size={40} color={colors.textSecondary} style={{ opacity: 0.3 }} />
               <Text style={styles.noLocTitle}>No locations available</Text>
               <Text style={styles.noLocSub}>Map requires coordinates which are missing for these listings.</Text>
            </View>
         </View>
      )}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  svgMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100,
    height: 120,
    backgroundColor: 'transparent',
  },
  markerPriceBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPriceText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  pinShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    backgroundColor: 'transparent',
  },
  pinShadowSelected: {
    shadowOpacity: 0.5,
    shadowRadius: 15,
    transform: [{ scale: 1.15 }],
  },
  webOverlayCard: {
    position: 'absolute',
    bottom: 200,
    left: '10%',
    right: '10%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 1000,
  },
  closeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayImageContainer: {
    height: 100,
    width: '100%',
    position: 'relative',
  },
  overlayImage: {
    width: '100%',
    height: '100%',
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayTextContent: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  overlayLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  overlayLoc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  overlayDetailsContent: {
    padding: 12,
  },
  overlaySpecs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  overlayBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  priceLabelWeb: {
    fontSize: 9,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  priceValWeb: {
    fontSize: 15,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomListContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 500,
  },
  listHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hListContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  hCard: {
    backgroundColor: colors.card,
    width: 180,
    height: 64,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hCardImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.input,
  },
  hCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hCardPrice: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  noLocContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noLocCard: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noLocTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noLocSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default memo(PropertyMapView);
