import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { FoodCard } from '../../components/Cards';
import { Button, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Header } from '../../components/Header';
import { FoodDetailModal } from '../../components/FoodDetailModal';
import { makeUseStyles, money, radius, Text, useColors } from '../../lib/theme';
import type { MenuItem, Restaurant } from '../../lib/types';
import { SAMPLE_MENU_ITEMS, SAMPLE_RESTAURANTS } from '../../lib/sampleCatalog';

export default function RestaurantScreen() {
  const colors = useColors();
  const s = useS();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();

  const [r, setR] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);

  const fetchDetails = useCallback(async (isInitial = false) => {
    if (!id) return;
    if (!isInitial) setError(null);

    try {
      const [a, b] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', id)
          .eq('is_available', true)
          .order('name'),
      ]);

      if (a.data) {
        setR(a.data as Restaurant);
        setItems((b.data && b.data.length > 0 ? b.data : []) as MenuItem[]);
      } else {
        // Fallback to sample catalog for San Carlos City
        const fallbackRest = SAMPLE_RESTAURANTS.find((item: Restaurant) => item.id === id) ?? SAMPLE_RESTAURANTS[0];
        const fallbackItems = SAMPLE_MENU_ITEMS.filter((item: MenuItem) => item.restaurant_id === fallbackRest.id);
        setR(fallbackRest);
        setItems(fallbackItems);
      }
    } catch {
      const fallbackRest = SAMPLE_RESTAURANTS.find((item: Restaurant) => item.id === id) ?? SAMPLE_RESTAURANTS[0];
      const fallbackItems = SAMPLE_MENU_ITEMS.filter((item: MenuItem) => item.restaurant_id === fallbackRest.id);
      setR(fallbackRest);
      setItems(fallbackItems);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails(true);
  }, [fetchDetails]);

  if (error) {
    return (
      <View style={s.screen}>
        <Header showBack title="Restaurant" />
        <ErrorState message={error} onRetry={() => fetchDetails(false)} />
      </View>
    );
  }

  if (!r) {
    return (
      <View style={s.screen}>
        <Header showBack title="Restaurant" />
        <LoadingState label="Loading menu..." />
      </View>
    );
  }

  const here = cart.restaurant?.id === r.id;

  return (
    <View style={s.screen}>
      <Header
        showBack
        title={r.name}
        rightAction={
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={s.headerCartBtn}
            accessibilityLabel="View cart">
            <Ionicons name="cart-outline" size={22} color={colors.ink} />
            {cart.count > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{cart.count}</Text>
              </View>
            )}
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={s.heroWrapper}>
          <Image
            source={{
              uri:
                r.image_url && r.image_url.startsWith('http')
                  ? r.image_url
                  : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
            }}
            style={s.heroImage}
            resizeMode="cover"
          />

          <View style={s.heroOverlay}>
            <View style={s.statusPill}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '900',
                  color: r.is_open ? '#10B981' : '#EF4444',
                }}>
                {r.is_open ? 'OPEN NOW' : 'CLOSED'}
              </Text>
            </View>
          </View>
        </View>

        {/* Restaurant Header Information */}
        <View style={s.infoCard}>
          <Text style={s.name}>{r.name}</Text>
          <Text style={s.desc}>{r.description}</Text>

          <View style={s.metaRow}>
            <View style={s.ratingBadge}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={s.ratingText}>{Number(r.rating).toFixed(1)}</Text>
            </View>
            <View style={s.metaDot} />
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={s.metaText}>{r.delivery_time_min} mins</Text>
            <View style={s.metaDot} />
            <Ionicons name="location-outline" size={14} color={colors.coral} />
            <Text style={s.metaText} numberOfLines={1}>
              {r.address ?? 'San Carlos City, Negros Occidental'}
            </Text>
          </View>
        </View>

        {/* Menu Items List */}
        <View style={s.menuSection}>
          <Text style={s.sectionTitle}>Available Menu ({items.length})</Text>

          {items.length === 0 ? (
            <EmptyState
              emoji="🍽️"
              title="No items found"
              hint="Check back later for available menu items."
            />
          ) : (
            items.map((i) => (
              <FoodCard
                key={i.id}
                item={i}
                qty={cart.qtyOf(i.id)}
                onPress={() => setModalItem(i)}
                onAdd={() => cart.add(i, { id: r.id, name: r.name })}
                onRemove={() => cart.remove(i)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {here && cart.count > 0 && (
        <View style={s.floatingCartBar}>
          <Button
            title={`View Cart • ${cart.count} item${cart.count > 1 ? 's' : ''} • ${money(cart.subtotal)}`}
            onPress={() => router.push('/(tabs)/cart')}
          />
        </View>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        visible={modalItem != null}
        item={modalItem}
        restaurant={r}
        onClose={() => setModalItem(null)}
        onAddToCart={(item: MenuItem, count: number) => {
          for (let k = 0; k < count; k++) {
            cart.add(item, { id: r.id, name: r.name });
          }
        }}
      />
    </View>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerCartBtn: {
      position: 'relative',
      padding: 6,
    },
    cartBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: colors.coral,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '900',
    },
    scrollContent: {
      paddingBottom: 110,
    },
    heroWrapper: {
      height: 200,
      width: '100%',
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroFallback: {
      backgroundColor: colors.coralSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroOverlay: {
      position: 'absolute',
      top: 14,
      right: 14,
    },
    statusPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.pill,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    infoCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: -28,
      borderRadius: radius.card,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.line,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    name: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 4,
    },
    desc: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 18,
      marginBottom: 12,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.coralSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.ink,
    },
    metaDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.muted,
    },
    metaText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    menuSection: {
      paddingHorizontal: 16,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 12,
    },
    floatingCartBar: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 20,
      shadowColor: colors.coral,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  })
);
