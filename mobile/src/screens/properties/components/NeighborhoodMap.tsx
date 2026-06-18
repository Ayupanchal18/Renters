import React, { useRef, useEffect, useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../theme/useTheme";
import { AmenityItem } from "../../../features/properties/services/neighborhoodService";

interface NeighborhoodMapProps {
  propertyLat: number;
  propertyLng: number;
  propertyTitle: string;
  amenities: AmenityItem[];
  selectedAmenity: AmenityItem | null;
}

export default function NeighborhoodMap({
  propertyLat,
  propertyLng,
  propertyTitle,
  amenities,
  selectedAmenity,
}: NeighborhoodMapProps) {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);

  // Generate Leaflet HTML
  const generateLeafletHTML = (
    propLat: number,
    propLng: number,
    propTitle: string,
    amenitiesList: AmenityItem[],
    primaryColor: string,
    secondaryColor: string,
    dark: boolean
  ) => {
    const amenityPins = amenitiesList.map((a, idx) => ({
      id: `${a.name}-${idx}`,
      name: a.name,
      category: a.category.replace("_", " "),
      lat: a.lat,
      lng: a.lng,
    }));

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
    .home-marker-css {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: ${primaryColor};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transform: translate(-16px, -16px);
    }
    .amenity-marker-css {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${secondaryColor};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transform: translate(-12px, -12px);
      transition: all 0.2s ease;
    }
    .amenity-marker-css.selected {
      width: 30px;
      height: 30px;
      transform: translate(-15px, -15px) scale(1.2);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 9999 !important;
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
    }).setView([${propLat}, ${propLng}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Add Home Marker
    const homeIcon = L.divIcon({
      className: '',
      html: \`<div class="home-marker-css"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>\`,
      iconAnchor: [16, 16]
    });
    L.marker([${propLat}, ${propLng}], { icon: homeIcon }).addTo(map)
      .bindPopup("<b>${propTitle.replace(/"/g, '\\"')}</b><br/>Property Location");

    // Add Amenity Markers
    const amenities = ${JSON.stringify(amenityPins)};
    const markersMap = new Map();

    amenities.forEach(a => {
      const amenityIcon = L.divIcon({
        className: '',
        html: \`<div id="marker-\${a.id}" class="amenity-marker-css"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>\`,
        iconAnchor: [12, 12]
      });

      const m = L.marker([a.lat, a.lng], { icon: amenityIcon }).addTo(map)
        .bindPopup("<b>" + a.name + "</b><br/>" + a.category);

      markersMap.set(a.id, { marker: m, data: a });
    });

    let currentSelectedId = null;

    function selectAmenity(name, lat, lng) {
      if (currentSelectedId) {
        const prevDiv = document.getElementById("marker-" + currentSelectedId);
        if (prevDiv) prevDiv.classList.remove('selected');
      }

      let foundId = null;
      for (const [id, value] of markersMap.entries()) {
        if (value.data.name === name && Math.abs(value.data.lat - lat) < 0.0001 && Math.abs(value.data.lng - lng) < 0.0001) {
          foundId = id;
          break;
        }
      }

      if (foundId) {
        currentSelectedId = foundId;
        const divElement = document.getElementById("marker-" + foundId);
        if (divElement) {
          divElement.classList.add('selected');
        }
        const value = markersMap.get(foundId);
        value.marker.openPopup();
        map.setView([lat, lng], 16, { animate: true });
      } else {
        map.setView([lat, lng], 16, { animate: true });
      }
    }

    function handleNativeMessage(dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.action === 'selectAmenity') {
          selectAmenity(data.name, data.lat, data.lng);
        } else if (data.action === 'fitBounds') {
          map.fitBounds(data.coords, { padding: [40, 40] });
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
    return generateLeafletHTML(
      propertyLat,
      propertyLng,
      propertyTitle,
      amenities,
      colors.primary,
      colors.secondary,
      isDark
    );
  }, [propertyLat, propertyLng, propertyTitle, amenities, colors.primary, colors.secondary, isDark]);

  // Animate map when a new amenity is selected
  useEffect(() => {
    if (selectedAmenity && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          action: "selectAmenity",
          name: selectedAmenity.name,
          lat: selectedAmenity.lat,
          lng: selectedAmenity.lng,
        })
      );
    }
  }, [selectedAmenity]);

  // Recenter map on active markers
  useEffect(() => {
    if (webViewRef.current && amenities.length > 0) {
      const coords = [
        [propertyLat, propertyLng],
        ...amenities.map((a) => [a.lat, a.lng]),
      ];
      webViewRef.current.postMessage(
        JSON.stringify({
          action: "fitBounds",
          coords,
        })
      );
    }
  }, [amenities, propertyLat, propertyLng]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html: leafletHTML }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      {/* Attribution */}
      <Text style={[styles.attribution, { color: colors.textSecondary }]}>
        Data from OpenStreetMap (via Overpass API)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 230,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  attribution: {
    position: "absolute",
    bottom: 6,
    right: 6,
    fontSize: 9,
    fontWeight: "600",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
