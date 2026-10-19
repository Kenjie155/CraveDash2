import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { RiderCard } from '../components/Cards';
import { Header } from '../components/Header';
import { SanCarlosMap } from '../components/SanCarlosMap';
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../components/ui';
import { makeUseStyles, money, radius, Text } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Address, Restaurant, Rider, GeoCoordinate } from '../lib/types';
import { SAMPLE_RESTAURANTS } from '../lib/sampleCatalog';
import {
  isWithinSanCarlosDeliveryArea,
  SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE,
} from '../lib/sanCarlosDelivery';

const FALLBACK_RIDERS: Rider[] = [
  {
    id: 'r-amir-khan',
    full_name: 'Amir Khan',
    phone: '0917-555-0192',
    avatar_url: null,
    vehicle_type: 'Motorbike',
    rating: 4.9,
    completed_deliveries: 312,
    base_fee: 45.0,
    eta_minutes: 20,
    is_available: true,
  },
  {
    id: 'r-lena-ortiz',
    full_name: 'Lena Ortiz',
    phone: '0928-555-0144',
    avatar_url: null,
    vehicle_type: 'Bicycle',
    rating: 4.8,
    completed_deliveries: 188,
    base_fee: 30.0,
    eta_minutes: 28,
    is_available: true,
  },
  {
    id: 'r-marcus-bell',
    full_name: 'Marcus Bell',
    phone: '0939-555-0188',
    avatar_url: null,
    vehicle_type: 'Scooter',
    rating: 4.7,
    completed_deliveries: 251,
    base_fee: 40.0,
    eta_minutes: 24,
    is_available: true,
  },
];

export default function Checkout() {
  const s = useS();
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();

  const [riders, setRiders] = useState<Rider[] | null>(null);
  const [rest, setRest] = useState<Restaurant | null>(null);
  const [saved, setSaved] = useState<Address[]>([]);
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState<GeoCoordinate | null>({ latitude: 10.4844, longitude: 123.4223 });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [riderId, setRiderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapInteracting, setMapInteracting] = useState(false);

  const restaurantId = cart.restaurant?.id;
  const userId = user?.id;

  const load = useCallback(async (isInitial = false) => {
    if (!cart.restaurant) return;
    if (!isInitial) setLoadError(null);

    try {
      const [a, b, c, d] = await Promise.all([
        supabase.from('riders').select('*').order('rating', { ascending: false }),
        supabase.from('restaurants').select('*').eq('id', cart.restaurant.id).maybeSingle(),
        user
          ? supabase.from('customer_addresses').select('*').order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      // Set riders
      if (a.data && a.data.length > 0) {
        setRiders(a.data as Rider[]);
        setRiderId(a.data[0].id);
      } else {
        setRiders(FALLBACK_RIDERS);
        setRiderId(FALLBACK_RIDERS[0].id);
      }

      // Set restaurant
      if (b.data) {
        setRest(b.data as Restaurant);
      } else {
        const found =
          SAMPLE_RESTAURANTS.find((r) => r.id === cart.restaurant?.id) ?? {
            id: cart.restaurant.id,
            name: cart.restaurant.name,
            description: 'San Carlos City Local Kitchen',
            image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
            emoji: '🍽️',
            address: 'San Carlos City, Negros Occidental',
            latitude: 10.4844,
            longitude: 123.4223,
            rating: 4.8,
            delivery_time_min: 25,
            is_open: true,
            is_featured: false,
          };
        setRest(found);
      }

      // Set addresses
      if (c.data && c.data.length > 0) {
        setSaved(c.data as Address[]);
        const first = c.data[0];
        setAddress(first.address_line);
        if (first.latitude != null && first.longitude != null) {
          setPin({ latitude: first.latitude, longitude: first.longitude });
        }
      }

      // Pre-fill user profile info
      if (d && 'data' in d && d.data) {
        const profile = d.data as { full_name?: string | null; phone?: string | null };
        setName((n) => n || profile.full_name || '');
        setPhone((p) => p || profile.phone || '');
      }
    } catch {
      setRiders(FALLBACK_RIDERS);
      setRiderId(FALLBACK_RIDERS[0].id);
      const fallbackRest =
        SAMPLE_RESTAURANTS.find((r) => r.id === cart.restaurant?.id) ?? SAMPLE_RESTAURANTS[0];
      setRest(fallbackRest);
    }
  }, [cart.restaurant, user]);

  useEffect(() => {
    load(true);
  }, [load, restaurantId, userId]);

  if (cart.lines.length === 0) {
    return (
      <View style={s.screen}>
        <Header showBack title="Checkout" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          hint="Add food from San Carlos City restaurants first."
        />
        <View style={{ paddingHorizontal: 24, marginTop: -30 }}>
          <Button title="Browse Restaurants" onPress={() => router.push('/(tabs)')} />
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={s.screen}>
        <Header showBack title="Checkout" />
        <ErrorState message={loadError} onRetry={() => load(false)} />
      </View>
    );
  }

  if (!riders || !rest) {
    return (
      <View style={s.screen}>
        <Header showBack title="Checkout" />
        <LoadingState label="Preparing checkout..." />
      </View>
    );
  }

  const selectedRider = riders.find((r) => r.id === riderId) ?? riders[0];
  const deliveryFee = selectedRider ? Number(selectedRider.base_fee) : 40;
  const grandTotal = cart.subtotal + deliveryFee;

  const startCoord: GeoCoordinate = {
    latitude: rest.latitude ?? 10.4844,
    longitude: rest.longitude ?? 123.4223,
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      return setError('Please enter your delivery street address.');
    }
    if (!name.trim()) {
      return setError('Please enter your contact name.');
    }
    if (!phone.trim()) {
      return setError('Please enter your contact phone number.');
    }
    if (!pin) {
      return setError('Please select your delivery location on the San Carlos City map.');
    }
    if (!isWithinSanCarlosDeliveryArea(pin)) {
      return setError(SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE);
    }
    if (!riderId) {
      return setError('Please choose a delivery rider.');
    }

    setBusy(true);
    setError(null);

    try {
      if (user) {
        // Try calling place_order RPC
        const { data, error: rpcErr } = await supabase.rpc('place_order', {
          p_restaurant_id: cart.restaurant!.id,
          p_items: cart.lines.map((l) => ({ menu_item_id: l.item.id, quantity: l.qty })),
          p_rider_id: riderId,
          p_address: address.trim(),
          p_lat: pin.latitude,
          p_lng: pin.longitude,
          p_name: name.trim(),
          p_phone: phone.trim(),
          p_notes: notes.trim() || null,
        });

        if (rpcErr) {
          // If server RPC failed (e.g. test restaurant or simulated rider), try direct insert
          const { data: directOrder, error: directErr } = await supabase
            .from('orders')
            .insert({
              customer_id: user.id,
              restaurant_id: cart.restaurant!.id,
              rider_id: riderId.startsWith('r-') ? null : riderId,
              status: 'placed',
              payment_method: 'cod',
              payment_status: 'unpaid',
              subtotal: cart.subtotal,
              delivery_fee: deliveryFee,
              total: grandTotal,
              delivery_address: address.trim(),
              delivery_lat: pin.latitude,
              delivery_lng: pin.longitude,
              contact_name: name.trim(),
              contact_phone: phone.trim(),
              notes: notes.trim() || null,
            })
            .select('id')
            .single();

          if (directErr) {
            setError(rpcErr.message || directErr.message);
            setBusy(false);
            return;
          }

          if (!saved.some((a) => a.address_line === address.trim())) {
            await supabase.from('customer_addresses').insert({
              user_id: user.id,
              label: 'Saved',
              address_line: address.trim(),
              latitude: pin.latitude,
              longitude: pin.longitude,
            });
          }

          cart.clear();
          router.replace(`/order/${directOrder.id}`);
          return;
        }

        if (!saved.some((a) => a.address_line === address.trim())) {
          await supabase.from('customer_addresses').insert({
            user_id: user.id,
            label: 'Saved',
            address_line: address.trim(),
            latitude: pin.latitude,
            longitude: pin.longitude,
          });
        }

        cart.clear();
        router.replace(`/order/${data}`);
      } else {
        // Guest mode fallback
        cart.clear();
        router.replace('/(tabs)/orders');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to place order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.screen}>
      <Header showBack title="Confirm Order" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!mapInteracting}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}>
        {/* Section 1: Delivery Address & Real Interactive Map */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Delivery Destination</Text>
          <Text style={s.sectionHint}>
            Interactive San Carlos City Map · Tap the map or pick a landmark below
          </Text>

          {/* Interactive OpenStreetMap */}
          <View
            style={s.mapWrapper}
            onTouchStart={() => setMapInteracting(true)}
            onTouchEnd={() => setMapInteracting(false)}
            onTouchCancel={() => setMapInteracting(false)}>
            <SanCarlosMap
              mode="picker"
              selectedCoord={pin}
              onSelectCoord={(coord, hint) => {
                setPin(coord);
                if (hint) {
                  setAddress((curr) => (curr ? `${hint}, ${curr}` : hint));
                }
                if (!isWithinSanCarlosDeliveryArea(coord)) {
                  setError(SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE);
                } else {
                  setError((curr) => (curr === SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE ? null : curr));
                }
              }}
              restaurantCoord={startCoord}
              restaurantName={rest.name}
              height={220}
              showLandmarks={true}
              onTouchStart={() => setMapInteracting(true)}
              onTouchEnd={() => setMapInteracting(false)}
            />
          </View>

          {/* Delivery Area Warning Banner */}
          {pin && !isWithinSanCarlosDeliveryArea(pin) && (
            <View style={s.restrictionWarningCard}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.restrictionWarningTitle}>Outside Delivery Area</Text>
                <Text style={s.restrictionWarningText}>
                  {SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE}
                </Text>
              </View>
            </View>
          )}

          {/* Saved Addresses quick-jump */}
          {saved.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.savedScroll}>
              {saved.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    setAddress(a.address_line);
                    if (a.latitude != null && a.longitude != null) {
                      const coord = { latitude: a.latitude, longitude: a.longitude };
                      setPin(coord);
                      if (!isWithinSanCarlosDeliveryArea(coord)) {
                        setError(SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE);
                      } else {
                        setError((curr) => (curr === SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE ? null : curr));
                      }
                    }
                  }}
                  style={s.savedChip}>
                  <Text style={s.savedLabel} numberOfLines={1}>
                    📍 {a.label}: {a.address_line}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Field
            label="Delivery Street Address"
            value={address}
            onChangeText={setAddress}
            placeholder="House/Unit #, Street, Barangay, San Carlos City"
          />
        </View>

        {/* Section 2: Contact Information */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Recipient Details</Text>
          <Field
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Juan Dela Cruz"
          />
          <Field
            label="Contact Mobile Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="0917-xxx-xxxx"
            keyboardType="phone-pad"
          />
          <Field
            label="Delivery Instructions (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Landmark, gate color, please call upon arrival..."
            multiline
          />
        </View>

        {/* Section 3: Select Available Rider */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Select Delivery Courier</Text>
          <Text style={s.sectionHint}>
            Assigned riders operating within San Carlos City limits
          </Text>
          {riders.map((r) => (
            <RiderCard
              key={r.id}
              rider={r}
              selected={r.id === riderId}
              onSelect={() => setRiderId(r.id)}
            />
          ))}
        </View>

        {/* Section 4: Payment Method */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Payment Method</Text>
          <View style={s.paymentBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 24 }}>💵</Text>
              <View>
                <Text style={s.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={s.paymentDesc}>
                  Pay in cash to your rider when your food arrives in San Carlos City.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 5: Order Summary */}
        <View style={s.summaryCard}>
          <Text style={s.sectionTitle}>Price Breakdown</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Items Subtotal</Text>
            <Text style={s.summaryValue}>{money(cart.subtotal)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>San Carlos Delivery Fee</Text>
            <Text style={s.summaryValue}>{money(deliveryFee)}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total Payment</Text>
            <Text style={s.totalValue}>{money(grandTotal)}</Text>
          </View>
        </View>

        {error && <Text style={s.errorText}>{error}</Text>}

        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <Button
            title={
              pin && !isWithinSanCarlosDeliveryArea(pin)
                ? 'Delivery Restricted to San Carlos City'
                : `Place Order • ${money(grandTotal)}`
            }
            onPress={handlePlaceOrder}
            disabled={busy || (pin ? !isWithinSanCarlosDeliveryArea(pin) : false)}
            loading={busy}
          />
        </View>
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
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.line,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 4,
    },
    sectionHint: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 12,
    },
    mapWrapper: {
      borderRadius: 14,
      overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.line,
    },
    savedScroll: {
      paddingBottom: 10,
      gap: 8,
    },
    savedChip: {
      backgroundColor: colors.coralSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      maxWidth: 220,
    },
    savedLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.coral,
    },
    paymentBox: {
      borderWidth: 1.5,
      borderColor: colors.coral,
      backgroundColor: colors.coralSoft,
      borderRadius: 14,
      padding: 14,
      marginTop: 6,
    },
    paymentName: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.ink,
    },
    paymentDesc: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: '600',
    },
    summaryValue: {
      fontSize: 13,
      color: colors.ink,
      fontWeight: '700',
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: 10,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.coral,
    },
    errorText: {
      color: colors.red,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    restrictionWarningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: '#FEF2F2',
      borderWidth: 1.5,
      borderColor: '#F87171',
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    restrictionWarningTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#991B1B',
      marginBottom: 2,
    },
    restrictionWarningText: {
      fontSize: 12,
      color: '#B91C1C',
      lineHeight: 16,
      fontWeight: '600',
    },
  })
);
