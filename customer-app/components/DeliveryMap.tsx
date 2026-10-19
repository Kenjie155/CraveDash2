import React from 'react';
import { StyleSheet, View } from 'react-native';
import { makeUseStyles, Text, useColors } from '../lib/theme';
import { SanCarlosMap } from './SanCarlosMap';

type Pt = { latitude: number; longitude: number };

type Props = {
  restaurant: Pt;
  restaurantName: string;
  destination: Pt;
  rider?: (Pt & { name: string; at: string | null }) | null;
};

// Real OpenStreetMap centered on San Carlos City, Negros Occidental.
// Displays the restaurant pickup location and customer delivery destination pin.
export function DeliveryMap({
  restaurant,
  restaurantName,
  destination,
  rider,
}: Props) {
  const s = useS();
  const colors = useColors();

  return (
    <View style={s.container}>
      <SanCarlosMap
        mode="view"
        restaurantCoord={restaurant}
        restaurantName={restaurantName}
        deliveryCoord={destination}
        deliveryAddress="Customer Destination"
        height={240}
        showLandmarks={false}
      />
      <View style={s.metaCard}>
        <View style={s.pointRow}>
          <View style={[s.dot, { backgroundColor: colors.coral }]} />
          <Text style={s.pointText} numberOfLines={1}>
            Pickup: <Text style={{ fontWeight: '800' }}>{restaurantName}</Text>
          </Text>
        </View>
        <View style={s.pointRow}>
          <View style={[s.dot, { backgroundColor: colors.green }]} />
          <Text style={s.pointText} numberOfLines={1}>
            Deliver to: <Text style={{ fontWeight: '800' }}>San Carlos City destination</Text>
          </Text>
        </View>
        {rider ? (
          <View style={s.pointRow}>
            <View style={[s.dot, { backgroundColor: '#3B82F6' }]} />
            <Text style={s.pointText} numberOfLines={1}>
              Rider: <Text style={{ fontWeight: '800' }}>{rider.name}</Text>
              {rider.at ? ` (recorded ${new Date(rider.at).toLocaleTimeString()})` : ''}
            </Text>
          </View>
        ) : null}
        <Text style={s.note}>
          Interactive San Carlos City Map (OpenStreetMap) · Live GPS driver tracking not enabled
        </Text>
      </View>
    </View>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    metaCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 6,
    },
    pointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    pointText: {
      fontSize: 13,
      color: colors.ink,
      flex: 1,
    },
    note: {
      fontSize: 11,
      color: colors.muted,
      fontStyle: 'italic',
      marginTop: 4,
    },
  })
);
