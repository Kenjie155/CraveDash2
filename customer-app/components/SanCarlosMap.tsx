import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, radius, Text, useColors } from '../lib/theme';
import { GeoCoordinate, SAN_CARLOS_LANDMARKS } from '../lib/types';
import {
  CRAVEDASH_STORE_CONFIG,
  isWithinSanCarlosDeliveryArea,
  SAN_CARLOS_BOUNDARY_POLYGON,
  SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE,
} from '../lib/sanCarlosDelivery';

export const SAN_CARLOS_CENTER: GeoCoordinate = {
  latitude: 10.4844,
  longitude: 123.4223,
};

export interface SanCarlosMapProps {
  mode?: 'picker' | 'view';
  selectedCoord?: GeoCoordinate | null;
  onSelectCoord?: (coord: GeoCoordinate, addressHint?: string) => void;
  restaurantCoord?: GeoCoordinate | null;
  restaurantName?: string;
  deliveryCoord?: GeoCoordinate | null;
  deliveryAddress?: string;
  height?: number;
  showLandmarks?: boolean;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

export function SanCarlosMap({
  mode = 'picker',
  selectedCoord,
  onSelectCoord,
  restaurantCoord,
  restaurantName = 'Restaurant',
  deliveryCoord,
  deliveryAddress = 'Delivery Location',
  height = 280,
  showLandmarks = true,
  onTouchStart,
  onTouchEnd,
}: SanCarlosMapProps) {
  const colors = useColors();
  const s = useS();
  const webViewRef = useRef<WebView | null>(null);
  const [mapError, setMapError] = useState(false);

  const activeCoord = selectedCoord ?? SAN_CARLOS_CENTER;
  const isDeliveryAllowed = isWithinSanCarlosDeliveryArea(activeCoord);

  // Landmarks list with CraveDash Store included
  const allLandmarks = useMemo(() => [
    {
      id: 'cravedash-demo-store',
      name: 'CraveDash Store (Demo)',
      coordinate: CRAVEDASH_STORE_CONFIG.coordinate,
      description: CRAVEDASH_STORE_CONFIG.description,
    },
    ...SAN_CARLOS_LANDMARKS,
  ], []);

  // Self-contained, highly-optimized Leaflet map with real OpenStreetMap tiles
  // Compatible with Expo Go on Android & iOS without requiring any Google Maps API keys
  const htmlContent = useMemo(() => {
    const isPicker = mode === 'picker';
    const centerLat = isPicker
      ? activeCoord.latitude
      : ((restaurantCoord?.latitude ?? SAN_CARLOS_CENTER.latitude) +
          (deliveryCoord?.latitude ?? SAN_CARLOS_CENTER.latitude)) /
        2;
    const centerLng = isPicker
      ? activeCoord.longitude
      : ((restaurantCoord?.longitude ?? SAN_CARLOS_CENTER.longitude) +
          (deliveryCoord?.longitude ?? SAN_CARLOS_CENTER.longitude)) /
        2;

    const restLat = restaurantCoord?.latitude ?? SAN_CARLOS_CENTER.latitude;
    const restLng = restaurantCoord?.longitude ?? SAN_CARLOS_CENTER.longitude;
    const delivLat = deliveryCoord?.latitude ?? activeCoord.latitude;
    const delivLng = deliveryCoord?.longitude ?? activeCoord.longitude;

    const safeRestName = (restaurantName || 'Restaurant').replace(/'/g, "\\'");
    const safeDelivAddr = (deliveryAddress || 'Your Destination').replace(/'/g, "\\'");

    const storeLat = CRAVEDASH_STORE_CONFIG.coordinate.latitude;
    const storeLng = CRAVEDASH_STORE_CONFIG.coordinate.longitude;
    const storeName = CRAVEDASH_STORE_CONFIG.name.replace(/'/g, "\\'");

    // Boundary coordinates in [lat, lng] format for Leaflet
    const boundaryLatLngs = SAN_CARLOS_BOUNDARY_POLYGON.map(([lng, lat]) => [lat, lng]);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map {
      height: 100%;
      width: 100%;
      background-color: #FFF9F4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: white;
      font-weight: 800;
      font-size: 18px;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }
    .restaurant-pin { background-color: #F2542D; }
    .delivery-pin { background-color: #10B981; }
    .store-pin { background-color: #0E7C7B; }
    .store-label {
      background-color: #0E7C7B;
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border: 1px solid #ffffff;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.18);
      font-size: 13px;
      padding: 4px;
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <script>
    try {
      var map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
        tap: false
      }).setView([${centerLat}, ${centerLng}], 15);

      // Real OpenStreetMap road tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // San Carlos City delivery boundary polygon
      var boundaryCoords = ${JSON.stringify(boundaryLatLngs)};
      L.polygon(boundaryCoords, {
        color: '#0E7C7B',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#0E7C7B',
        fillOpacity: 0.05
      }).addTo(map);

      var boundaryVs = ${JSON.stringify(SAN_CARLOS_BOUNDARY_POLYGON)};
      function isInsideBoundary(lng, lat) {
        var inside = false;
        for (var i = 0, j = boundaryVs.length - 1; i < boundaryVs.length; j = i++) {
          var xi = boundaryVs[i][0], yi = boundaryVs[i][1];
          var xj = boundaryVs[j][0], yj = boundaryVs[j][1];
          var intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      }

      // Add CraveDash Store Marker (Temporary demo location)
      var storeIcon = L.divIcon({
        className: 'custom-pin store-pin',
        html: '🏢',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });
      var storeMarker = L.marker([${storeLat}, ${storeLng}], {
        icon: storeIcon,
        zIndexOffset: 600
      }).addTo(map);
      storeMarker.bindPopup("<b>${storeName}</b><br>Temporary Demo Store Location<br><small style='color:#555;'>San Carlos City, Negros Occidental</small>");

      function sendToNative(lat, lng) {
        var payload = JSON.stringify({ type: 'CRAVEDASH_MAP_COORDINATE', lat: lat, lng: lng });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(payload);
        } else if (window.parent) {
          window.parent.postMessage(payload, '*');
        }
      }

      var isPicker = ${isPicker ? 'true' : 'false'};

      if (isPicker) {
        var pickerIcon = L.divIcon({
          className: 'custom-pin delivery-pin',
          html: '📍',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        });

        window.currentMarker = L.marker([${activeCoord.latitude}, ${activeCoord.longitude}], {
          icon: pickerIcon,
          draggable: true
        }).addTo(map);

        function updateSpot(lat, lng) {
          var inside = isInsideBoundary(lng, lat);
          window.currentMarker.setLatLng([lat, lng]);
          if (inside) {
            window.currentMarker.bindPopup("<b>Selected Delivery Spot</b><br>San Carlos City, Negros Occidental<br><span style='color:#10B981;font-weight:700;'>✓ Inside Delivery Area</span>").openPopup();
          } else {
            window.currentMarker.bindPopup("<b>Selected Delivery Spot</b><br><span style='color:#EF4444;font-weight:800;'>⚠ Outside Delivery Area</span><br><small style='color:#666;'>Sorry, CraveDash currently delivers only within San Carlos City, Negros Occidental.</small>").openPopup();
          }
          sendToNative(lat, lng);
        }

        var initialInside = isInsideBoundary(${activeCoord.longitude}, ${activeCoord.latitude});
        if (initialInside) {
          window.currentMarker.bindPopup("<b>Selected Delivery Spot</b><br>San Carlos City, Negros Occidental<br><span style='color:#10B981;font-weight:700;'>✓ Inside Delivery Area</span>").openPopup();
        } else {
          window.currentMarker.bindPopup("<b>Selected Delivery Spot</b><br><span style='color:#EF4444;font-weight:800;'>⚠ Outside Delivery Area</span><br><small style='color:#666;'>Sorry, CraveDash currently delivers only within San Carlos City, Negros Occidental.</small>").openPopup();
        }

        window.currentMarker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          updateSpot(pos.lat, pos.lng);
        });

        map.on('click', function(e) {
          updateSpot(e.latlng.lat, e.latlng.lng);
        });
      } else {
        // Order view mode: Restaurant & Destination pins
        var restIcon = L.divIcon({
          className: 'custom-pin restaurant-pin',
          html: '🏬',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        });
        var destIcon = L.divIcon({
          className: 'custom-pin delivery-pin',
          html: '🏠',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        });

        var m1 = L.marker([${restLat}, ${restLng}], { icon: restIcon }).addTo(map)
          .bindPopup("<b>${safeRestName}</b><br>Pickup Merchant");
        var m2 = L.marker([${delivLat}, ${delivLng}], { icon: destIcon }).addTo(map)
          .bindPopup("<b>Delivery Destination</b><br>${safeDelivAddr}").openPopup();

        var latlngs = [[${restLat}, ${restLng}], [${delivLat}, ${delivLng}]];
        var polyline = L.polyline(latlngs, {
          color: '#F2542D',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.95
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }

      setTimeout(function() {
        map.invalidateSize();
      }, 250);
      window.addEventListener('resize', function() {
        map.invalidateSize();
      });
    } catch(e) {
      console.error(e);
      document.body.innerHTML = '<div style="padding:20px;text-align:center;color:#EF4444;font-size:14px;">Failed to load OpenStreetMap tiles.</div>';
    }
  </script>
</body>
</html>`;
  }, [mode, activeCoord.latitude, activeCoord.longitude, restaurantCoord, deliveryCoord, restaurantName, deliveryAddress]);

  const handleLandmarkSelect = (landmark: (typeof allLandmarks)[0]) => {
    onSelectCoord?.(landmark.coordinate, landmark.name);
    const js = `
      if (typeof map !== 'undefined') {
        map.setView([${landmark.coordinate.latitude}, ${landmark.coordinate.longitude}], 16);
        if (typeof window.currentMarker !== 'undefined') {
          window.currentMarker.setLatLng([${landmark.coordinate.latitude}, ${landmark.coordinate.longitude}]);
          window.currentMarker.bindPopup("<b>${landmark.name.replace(/'/g, "\\'")}</b><br>San Carlos City, Negros Occidental<br><span style='color:#10B981;font-weight:700;'>✓ Inside Delivery Area</span>").openPopup();
        }
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
  };

  const handleRecenter = () => {
    onSelectCoord?.(SAN_CARLOS_CENTER, 'San Carlos City Plaza');
    const js = `
      if (typeof map !== 'undefined') {
        map.setView([${SAN_CARLOS_CENTER.latitude}, ${SAN_CARLOS_CENTER.longitude}], 15);
        if (typeof window.currentMarker !== 'undefined') {
          window.currentMarker.setLatLng([${SAN_CARLOS_CENTER.latitude}, ${SAN_CARLOS_CENTER.longitude}]);
          window.currentMarker.bindPopup("<b>San Carlos City Plaza</b><br>San Carlos City, Negros Occidental<br><span style='color:#10B981;font-weight:700;'>✓ Inside Delivery Area</span>").openPopup();
        }
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
  };

  return (
    <View style={s.container}>
      <View
        style={[s.mapFrame, { height }]}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}>
        {/* Native WebView rendering Leaflet OpenStreetMap */}
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={s.map}
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data);
              if (payload?.type === 'CRAVEDASH_MAP_COORDINATE' && onSelectCoord) {
                onSelectCoord({ latitude: payload.lat, longitude: payload.lng });
              }
            } catch {
              // ignore non-json messages
            }
          }}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          onError={() => setMapError(true)}
        />

        {/* Map Header Floating Overlay */}
        <View style={s.mapOverlayHeader} pointerEvents="box-none">
          <View style={s.cityBadge}>
            <Ionicons name="map" size={14} color="#0E7C7B" />
            <Text style={s.cityBadgeText}>San Carlos City · CraveDash Delivery Area</Text>
          </View>

          {mode === 'picker' && (
            <Pressable
              onPress={handleRecenter}
              style={s.locateBtn}
              accessibilityLabel="Reset to San Carlos City Center">
              <Ionicons name="locate" size={16} color="#241B16" />
            </Pressable>
          )}
        </View>

        {mapError && (
          <View style={s.errorContainer}>
            <Text style={{ color: colors.red, fontWeight: '700', marginBottom: 6 }}>
              Map failed to load
            </Text>
            <Pressable
              style={s.retryBtn}
              onPress={() => {
                setMapError(false);
                webViewRef.current?.reload();
              }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Retry Map</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Selected Coordinates & Delivery Status bar */}
      {mode === 'picker' && (
        <View style={[s.coordinateBar, !isDeliveryAllowed && s.coordinateBarRestricted]}>
          <Ionicons
            name={isDeliveryAllowed ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={isDeliveryAllowed ? colors.green : '#EF4444'}
          />
          <Text
            style={[s.coordinateText, !isDeliveryAllowed && s.coordinateTextRestricted]}
            numberOfLines={1}>
            {isDeliveryAllowed
              ? `Delivery Spot: ${activeCoord.latitude.toFixed(4)}°N, ${activeCoord.longitude.toFixed(4)}°E (San Carlos City)`
              : `Selected Spot: ${activeCoord.latitude.toFixed(4)}°N, ${activeCoord.longitude.toFixed(4)}°E (Outside Area)`}
          </Text>
        </View>
      )}

      {/* Delivery Area Warning Banner if outside San Carlos City */}
      {mode === 'picker' && !isDeliveryAllowed && (
        <View style={s.restrictionBanner}>
          <Ionicons name="warning" size={16} color="#B91C1C" style={{ marginTop: 1 }} />
          <Text style={s.restrictionText}>
            {SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE}
          </Text>
        </View>
      )}

      {/* San Carlos City Quick Landmark Chips */}
      {mode === 'picker' && showLandmarks && (
        <View style={s.landmarksSection}>
          <Text style={s.landmarkTitle}>San Carlos City Locations</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.landmarkScroll}>
            {allLandmarks.map((lm) => {
              const isSelected =
                Math.abs(activeCoord.latitude - lm.coordinate.latitude) < 0.0008 &&
                Math.abs(activeCoord.longitude - lm.coordinate.longitude) < 0.0008;

              const isStore = lm.id === 'cravedash-demo-store';

              return (
                <Pressable
                  key={lm.id}
                  onPress={() => handleLandmarkSelect(lm)}
                  style={[
                    s.landmarkChip,
                    isStore && s.storeChip,
                    isSelected && s.landmarkChipActive,
                  ]}>
                  <Ionicons
                    name={isStore ? 'business' : isSelected ? 'pin' : 'location-outline'}
                    size={14}
                    color={isSelected ? '#fff' : isStore ? '#0E7C7B' : colors.coral}
                  />
                  <Text
                    style={[
                      s.landmarkChipText,
                      isStore && { color: isSelected ? '#fff' : '#0E7C7B', fontWeight: '800' },
                      isSelected && { color: '#fff' },
                    ]}>
                    {lm.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    container: {
      marginBottom: 14,
    },
    mapFrame: {
      borderRadius: radius.card,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line,
      position: 'relative',
      backgroundColor: '#FFF9F4',
    },
    map: {
      width: '100%',
      height: '100%',
      backgroundColor: '#FFF9F4',
    },
    mapOverlayHeader: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    cityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cityBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#241B16',
    },
    locateBtn: {
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    errorContainer: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 20,
    },
    retryBtn: {
      backgroundColor: colors.coral,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    coordinateBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: '#ECFDF5',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#A7F3D0',
    },
    coordinateBarRestricted: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    coordinateText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#065F46',
      flex: 1,
    },
    coordinateTextRestricted: {
      color: '#991B1B',
    },
    restrictionBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 6,
      padding: 10,
      backgroundColor: '#FEF2F2',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#F87171',
    },
    restrictionText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#B91C1C',
      flex: 1,
      lineHeight: 16,
    },
    landmarksSection: {
      marginTop: 10,
    },
    landmarkTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.muted,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    landmarkScroll: {
      gap: 8,
      paddingBottom: 4,
    },
    landmarkChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
    },
    storeChip: {
      backgroundColor: '#E6FFFA',
      borderColor: '#81E6D9',
    },
    landmarkChipActive: {
      backgroundColor: colors.coral,
      borderColor: colors.coral,
    },
    landmarkChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.ink,
    },
  })
);
