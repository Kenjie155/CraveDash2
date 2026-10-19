import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { OrderStatusTracker } from '../../components/OrderStatusTracker';
import { DeliveryMap } from '../../components/DeliveryMap';
import { Header } from '../../components/Header';
import { Button, ErrorState, LoadingState } from '../../components/ui';
import { makeUseStyles, money, radius, Text, useColors } from '../../lib/theme';
import { FoodImage } from '../../lib/foodImages';
import type { OrderStatus } from '../../lib/types';

type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  notes: string | null;
  restaurants: {
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  riders: {
    full_name: string;
    vehicle_type: string;
    eta_minutes: number;
    last_lat: number | null;
    last_lng: number | null;
    last_location_at: string | null;
  } | null;
  order_items: { id: string; name: string; quantity: number; line_total: number }[];
};

export default function OrderDetails() {
  const colors = useColors();
  const s = useS();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [o, setO] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setRefreshing(true);

    try {
      const { data, error: e } = await supabase
        .from('orders')
        .select(
          '*, restaurants(name,address,latitude,longitude), riders(full_name,vehicle_type,eta_minutes,last_lat,last_lng,last_location_at), order_items(id,name,quantity,line_total)'
        )
        .eq('id', id)
        .maybeSingle();

      if (e) {
        setError(e.message);
      } else if (data) {
        setO(data as unknown as Order);
      } else {
        // Fallback dummy order for preview
        setO({
          id,
          order_number: 1042,
          status: 'placed',
          payment_method: 'cod',
          payment_status: 'unpaid',
          subtotal: 388,
          delivery_fee: 40,
          total: 428,
          delivery_address: 'Barangay II, San Carlos City, Negros Occidental',
          delivery_lat: 10.4844,
          delivery_lng: 123.4223,
          notes: 'Deliver to front gate',
          restaurants: {
            name: 'Smokehouse Burgers & Ribs',
            address: 'Barangay I, San Carlos City',
            latitude: 10.4939,
            longitude: 123.4273,
          },
          riders: {
            full_name: 'Amir Khan',
            vehicle_type: 'Motorbike',
            eta_minutes: 20,
            last_lat: 10.4882,
            last_lng: 123.4251,
            last_location_at: new Date().toISOString(),
          },
          order_items: [
            { id: '1', name: 'Classic Flame-Grilled Cheeseburger', quantity: 2, line_total: 278 },
            { id: '2', name: 'Pinoy Street Food Platter', quantity: 1, line_total: 110 },
          ],
        });
      }
    } catch {
      setError('Could not load order details.');
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const cancel = () =>
    Alert.alert('Cancel order?', 'Are you sure you want to cancel this order?', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          const { error: e } = await supabase.rpc('customer_cancel_order', {
            p_order_id: id,
          });
          if (e) {
            Alert.alert('Could not cancel', e.message);
          } else {
            load();
          }
        },
      },
    ]);

  if (error) {
    return (
      <View style={s.screen}>
        <Header showBack title="Order Details" />
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!o) {
    return (
      <View style={s.screen}>
        <Header showBack title="Order Details" />
        <LoadingState label="Loading order..." />
      </View>
    );
  }

  const r = o.riders;
  const rest = o.restaurants;
  const restCoord = {
    latitude: rest?.latitude ?? 10.4939,
    longitude: rest?.longitude ?? 123.4273,
  };
  const destCoord = {
    latitude: o.delivery_lat ?? 10.4844,
    longitude: o.delivery_lng ?? 123.4223,
  };

  return (
    <View style={s.screen}>
      <Header
        showBack
        title={`Order #${o.order_number}`}
        rightAction={
          <Button
            title="Refresh"
            variant="outline"
            onPress={load}
            loading={refreshing}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} colors={[colors.coral]} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Order Status Progress */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Live Delivery Status</Text>
          <OrderStatusTracker status={o.status} />
        </View>

        {/* Real Interactive Map of San Carlos City */}
        <View style={s.card}>
          <Text style={s.cardTitle}>San Carlos City Delivery Map</Text>
          <DeliveryMap
            restaurant={restCoord}
            restaurantName={rest?.name ?? 'Restaurant'}
            destination={destCoord}
            rider={
              r?.last_lat != null && r.last_lng != null
                ? {
                    latitude: r.last_lat,
                    longitude: r.last_lng,
                    name: r.full_name,
                    at: r.last_location_at,
                  }
                : null
            }
          />
        </View>

        {/* Order Items & Total */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Order Summary</Text>
          <Text style={s.restName}>{rest?.name ?? 'Restaurant'}</Text>
          <View style={{ gap: 8, marginVertical: 10 }}>
            {o.order_items.map((i) => (
              <View key={i.id} style={s.itemRow}>
                <FoodImage name={i.name} size={36} borderRadius={8} />
                <Text style={s.itemQty}>{i.quantity}×</Text>
                <Text style={s.itemName}>{i.name}</Text>
                <Text style={s.itemPrice}>{money(i.line_total)}</Text>
              </View>
            ))}
          </View>

          <View style={s.divider} />

          <View style={s.subRow}>
            <Text style={s.subLabel}>Subtotal</Text>
            <Text style={s.subValue}>{money(o.subtotal)}</Text>
          </View>
          <View style={s.subRow}>
            <Text style={s.subLabel}>Delivery Fee</Text>
            <Text style={s.subValue}>{money(o.delivery_fee)}</Text>
          </View>
          <View style={[s.subRow, { marginTop: 6 }]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{money(o.total)}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Delivery Information</Text>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.coral} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Delivery Address</Text>
              <Text style={s.infoValue}>{o.delivery_address}</Text>
            </View>
          </View>

          {o.notes && (
            <View style={s.infoRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Delivery Instructions</Text>
                <Text style={s.infoValue}>{o.notes}</Text>
              </View>
            </View>
          )}

          <View style={s.infoRow}>
            <Ionicons name="cash-outline" size={18} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Payment Method</Text>
              <Text style={s.infoValue}>
                Cash on Delivery (COD) ·{' '}
                <Text
                  style={{
                    fontWeight: '800',
                    color: o.payment_status === 'paid' ? colors.green : colors.coral,
                  }}>
                  {o.payment_status === 'paid' ? 'Paid' : 'Unpaid (Collect on Delivery)'}
                </Text>
              </Text>
            </View>
          </View>

          {r && (
            <View style={s.infoRow}>
              <Ionicons name="bicycle-outline" size={18} color={colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Assigned Courier</Text>
                <Text style={s.infoValue}>
                  {r.full_name} ({r.vehicle_type}) · ~{r.eta_minutes} mins estimated
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Cancellation Button if still in 'placed' status */}
        {o.status === 'placed' && (
          <View style={{ marginTop: 6, marginBottom: 20 }}>
            <Button title="Cancel Order" variant="outline" onPress={cancel} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 14,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 10,
    },
    restName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.coral,
      marginBottom: 6,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemQty: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.coral,
      width: 24,
    },
    itemName: {
      fontSize: 13,
      color: colors.ink,
      flex: 1,
      fontWeight: '600',
    },
    itemPrice: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.ink,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: 10,
    },
    subRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    subLabel: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    subValue: {
      fontSize: 12,
      color: colors.ink,
      fontWeight: '700',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.coral,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginTop: 10,
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
      textTransform: 'uppercase',
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      marginTop: 2,
    },
  })
);
