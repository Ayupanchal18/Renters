import React, { useRef, useEffect, useState, memo, useMemo } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions, FlatList, Platform, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const webViewRef = useRef<WebView>(null);
  const listRef = useRef<FlatList>(null);
  const isTappingMarker = useRef(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const themeColor = type === 'buy' ? colors.success : colors.primary;

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
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)}L`;
    return `₹${price.toLocaleString()}`;
  };

  // Generate Leaflet HTML
  const generateLeafletHTML = (
    propsList: Property[],
    themeHex: string,
    dark: boolean
  ) => {
    const markers = propsList.map(p => {
      const coords = getCoords(p);
      return {
        id: p._id,
        lat: coords?.latitude,
        lng: coords?.longitude,
        label: formatPrice(p),
        selected: selectedPropertyId === p._id
      };
    }).filter(m => m.lat !== undefined && m.lng !== undefined);

    let initialLat = 20.5937;
    let initialLng = 78.9629;
    let initialZoom = 5;

    const selectedCoords = selectedPropertyId ? getCoords(propsList.find(p => p._id === selectedPropertyId) || propsList[0]) : null;
    if (selectedCoords) {
      initialLat = selectedCoords.latitude;
      initialLng = selectedCoords.longitude;
      initialZoom = 13;
    } else if (markers.length > 0) {
      const sum = markers.reduce((acc, curr) => ({ lat: acc.lat + curr.lat!, lng: acc.lng + curr.lng! }), { lat: 0, lng: 0 });
      initialLat = sum.lat / markers.length;
      initialLng = sum.lng / markers.length;
      initialZoom = 10;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: ${dark ? '#0f172a' : '#f8fafc'};
    }
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    .leaflet-bar a {
      background-color: ${dark ? '#1e293b' : '#ffffff'} !important;
      color: ${dark ? '#f8fafc' : '#0f172a'} !important;
      border-bottom: 1px solid ${dark ? '#334155' : '#e2e8f0'} !important;
    }
    ${dark ? `
    .leaflet-tile-container {
      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
    }
    ` : ''}
    .leaflet-top.leaflet-left {
      margin-top: 80px !important;
    }
    .price-tag-container {
      width: max-content !important;
      height: auto !important;
    }
    .price-tag-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${dark ? '#1e293b' : '#ffffff'};
      border: 1.5px solid ${themeHex};
      border-radius: 8px;
      padding: 5px 9px;
      font-weight: 800;
      font-size: 11px;
      color: ${dark ? '#f8fafc' : '#0f172a'};
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      white-space: nowrap;
      position: relative;
      transition: all 0.2s ease;
      transform: translate(-50%, -100%);
      margin-top: -5px;
    }
    .price-tag-marker.selected {
      background-color: ${themeHex};
      border-color: ${themeHex};
      color: #ffffff !important;
      z-index: 99999 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translate(-50%, -100%) scale(1.12);
    }
    .price-tag-marker:after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      width: 8px;
      height: 8px;
      background-color: inherit;
      border-right: 1.5px solid;
      border-bottom: 1.5px solid;
      border-color: inherit;
      transform: translateX(-50%) rotate(45deg);
    }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${initialLat}, ${initialLng}], ${initialZoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const markersMap = new Map();

    function setMarkers(markersList) {
      for (const m of markersMap.values()) {
        map.removeLayer(m);
      }
      markersMap.clear();

      markersList.forEach(m => {
        const isSelected = m.selected ? 'selected' : '';
        const markerIcon = L.divIcon({
          className: 'price-tag-container',
          html: \`<div class="price-tag-marker \${isSelected}">\${m.label}</div>\`,
          iconSize: null,
          iconAnchor: [0, 0]
        });

        const marker = L.marker([m.lat, m.lng], { icon: markerIcon }).addTo(map);
        
        marker.on('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'markerClick',
            id: m.id
          }));
        });

        markersMap.set(m.id, marker);
      });
    }

    const initialMarkers = ${JSON.stringify(markers)};
    setMarkers(initialMarkers);

    if (initialMarkers.length > 0 && !${selectedPropertyId !== null}) {
      const latlngs = initialMarkers.map(m => [m.lat, m.lng]);
      map.fitBounds(latlngs, { padding: [50, 50] });
    }

    function handleNativeMessage(dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.action === 'setMarkers') {
          setMarkers(data.markers);
        } else if (data.action === 'panTo') {
          map.setView([data.lat, data.lng], data.zoom || map.getZoom(), { animate: true });
        } else if (data.action === 'fitBounds') {
          map.fitBounds(data.coords, { padding: [50, 50] });
        }
      } catch (err) {
        console.error(err);
      }
    }

    document.addEventListener('message', function(event) {
      handleNativeMessage(event.data);
    });
    window.addEventListener('message', function(event) {
      handleNativeMessage(event.data);
    });
  </script>
</body>
</html>
`;
  };

  const leafletHTML = useMemo(() => {
    return generateLeafletHTML(validProperties, themeColor, isDark);
  }, [validProperties, themeColor, isDark]);

  // Update selection/markers on changes
  useEffect(() => {
    if (webViewRef.current && validProperties.length > 0) {
      const markers = validProperties.map(p => {
        const coords = getCoords(p);
        return {
          id: p._id,
          lat: coords?.latitude,
          lng: coords?.longitude,
          label: formatPrice(p),
          selected: selectedPropertyId === p._id
        };
      }).filter(m => m.lat !== undefined && m.lng !== undefined);

      webViewRef.current.postMessage(JSON.stringify({
        action: 'setMarkers',
        markers
      }));
    }
  }, [selectedPropertyId, validProperties]);

  // Adjust zoom bounds when properties change
  useEffect(() => {
    if (validProperties.length > 0 && webViewRef.current) {
      const coords = validProperties.map(p => getCoords(p)).filter(c => c !== null) as { latitude: number, longitude: number }[];
      if (coords.length > 0) {
        webViewRef.current.postMessage(JSON.stringify({
          action: 'fitBounds',
          coords: coords.map(c => [c.latitude, c.longitude])
        }));
      }
    }
  }, [validProperties.length]);

  const handleMarkerPress = (property: Property) => {
    isTappingMarker.current = true;
    setSelectedPropertyId(property._id);
    setShowOverlay(true);

    const coords = getCoords(property);
    if (coords && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        action: 'panTo',
        lat: coords.latitude,
        lng: coords.longitude,
        zoom: 14
      }));
    }

    const index = validProperties.findIndex(p => p._id === property._id);
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }

    setTimeout(() => {
      isTappingMarker.current = false;
    }, 850);
  };

  const handleScrollEnd = (event: any) => {
    if (isTappingMarker.current) return;

    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const itemWidth = 180 + 12; // card width + gap
    const index = Math.round(contentOffsetX / itemWidth);

    if (index >= 0 && index < validProperties.length) {
      const activeProperty = validProperties[index];
      if (activeProperty && activeProperty._id !== selectedPropertyId) {
        setSelectedPropertyId(activeProperty._id);
        const coords = getCoords(activeProperty);
        if (coords && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            action: 'panTo',
            lat: coords.latitude,
            lng: coords.longitude,
            zoom: 14
          }));
        }
      }
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'markerClick') {
        const prop = validProperties.find(p => p._id === data.id);
        if (prop) {
          handleMarkerPress(prop);
        }
      }
    } catch (err) {
      console.error('WebView message error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={[styles.map, Platform.OS === 'android' && { opacity: 0.99 }]}
        androidLayerType="software"
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {selectedProperty && showOverlay && (
        <Modal
          visible={showOverlay}
          transparent={true}
          animationType="fade"
          hardwareAccelerated={true}
          onRequestClose={() => setShowOverlay(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'transparent' }}
            onPress={() => setShowOverlay(false)}
          >
            <Pressable style={styles.webOverlayCard} onPress={() => { /* Consume press to prevent closing */ }}>
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
                    onPress={() => {
                      setShowOverlay(false);
                      onPropertyPress(selectedProperty);
                    }}
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <ArrowRight size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
          snapToInterval={180 + 12}
          snapToAlignment="center"
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
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
    ...Platform.select({
      android: {
        opacity: 0.99,
      },
    }),
  },
  map: {
    flex: 1,
  },
  priceTagMarker: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
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
    elevation: 30,
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
    bottom: 80,
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
