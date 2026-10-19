import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../context/CartContext';
import { CategoryCard, FoodCard, RestaurantCard } from '../../components/Cards';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { FoodDetailModal } from '../../components/FoodDetailModal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { makeUseStyles, radius, Text, useColors } from '../../lib/theme';
import type { Category, MenuItem, Restaurant } from '../../lib/types';
import {
  SAMPLE_CATEGORIES,
  SAMPLE_MENU_ITEMS,
  SAMPLE_RESTAURANTS,
} from '../../lib/sampleCatalog';

export default function Home() {
  const colors = useColors();
  const s = useS();
  const router = useRouter();
  const cart = useCart();
  const { favs, toggle, reload } = useFavorites();

  const [data, setData] = useState<{
    r: Restaurant[];
    c: Category[];
    m: MenuItem[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);

    try {
      const [r, c, m] = await Promise.all([
        supabase.from('restaurants').select('*').order('rating', { ascending: false }),
        supabase.from('food_categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').eq('is_available', true),
      ]);

      const restaurants =
        r.data && r.data.length > 0 ? (r.data as Restaurant[]) : SAMPLE_RESTAURANTS;
      const categories =
        c.data && c.data.length > 0 ? (c.data as Category[]) : SAMPLE_CATEGORIES;
      const menuItems =
        m.data && m.data.length > 0 ? (m.data as MenuItem[]) : SAMPLE_MENU_ITEMS;

      setData({
        r: restaurants,
        c: categories,
        m: menuItems,
      });
    } catch {
      // Offline or network error fallback
      setData({
        r: SAMPLE_RESTAURANTS,
        c: SAMPLE_CATEGORIES,
        m: SAMPLE_MENU_ITEMS,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      reload();
    }, [load, reload])
  );

  const view = useMemo(() => {
    if (!data) return null;
    const t = q.trim().toLowerCase();

    // Filter menu items
    const items = data.m.filter((i) => {
      const matchesCat = !cat || i.category_id === cat;
      const matchesText =
        !t ||
        i.name.toLowerCase().includes(t) ||
        (i.description && i.description.toLowerCase().includes(t));
      return matchesCat && matchesText;
    });

    const itemRestIds = new Set(items.map((i) => i.restaurant_id));

    // Filter restaurants
    const rests = data.r.filter((r) => {
      const matchesText =
        !t ||
        r.name.toLowerCase().includes(t) ||
        (r.description && r.description.toLowerCase().includes(t)) ||
        itemRestIds.has(r.id);
      const matchesCat = !cat || itemRestIds.has(r.id);
      return matchesText && matchesCat;
    });

    // Popular items for San Carlos City
    const popular = data.m.filter((i) => i.is_popular);

    return { items, rests, popular };
  }, [data, q, cat]);

  if (error) {
    return (
      <View style={s.screen}>
        <Header locationTitle="San Carlos City, Negros Occ." />
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!data || !view) {
    return (
      <View style={s.screen}>
        <Header locationTitle="San Carlos City, Negros Occ." />
        <LoadingState label="Loading fresh flavors..." />
      </View>
    );
  }

  const restOf = (id: string): Restaurant => {
    return (
      data.r.find((r) => r.id === id) ?? {
        id,
        name: 'San Carlos Kitchen',
        description: 'Authentic local taste',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        emoji: '🍽️',
        address: 'San Carlos City, Negros Occidental',
        latitude: 10.4844,
        longitude: 123.4223,
        rating: 4.8,
        delivery_time_min: 25,
        is_open: true,
        is_featured: false,
      }
    );
  };

  const activeCategoryName = cat
    ? data.c.find((c) => c.id === cat)?.name ?? 'Selected Category'
    : 'All Categories';

  return (
    <View style={s.screen}>
      {/* Top Header with City Delivery Location */}
      <Header
        locationTitle="San Carlos City, Negros Occ."
        onLocationPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} colors={[colors.coral]} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Modern Search Bar */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <SearchBar
            value={q}
            onChangeText={setQ}
            placeholder="Search burgers, inasal, batchoy, drinks..."
            onClear={() => setQ('')}
          />
        </View>

        {/* Hero Promotional Banner (when not searching) */}
        {!q && !cat && (
          <View style={s.promoBanner}>
            <View style={{ flex: 1 }}>
              <View style={s.promoTag}>
                <Text style={s.promoTagText}>SAN CARLOS SPECIAL</Text>
              </View>
              <Text style={s.promoTitle}>Craving Local Bites?</Text>
              <Text style={s.promoSub}>
                Get free delivery & ₱50 off on orders above ₱350 with code{' '}
                <Text style={{ fontWeight: '900', color: colors.coral }}>CRAVE50</Text>
              </Text>
            </View>
            <Text style={{ fontSize: 44, marginLeft: 10 }}>🛵</Text>
          </View>
        )}

        {/* 12 Category Filter Chips */}
        <View style={{ marginTop: 14 }}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Categories</Text>
            {cat && (
              <Pressable onPress={() => setCat(null)}>
                <Text style={s.clearFilterText}>Clear filter</Text>
              </Pressable>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.categoriesScroll}>
            <CategoryCard
              label="All Cuisines"
              icon="🍽️"
              active={!cat}
              onPress={() => setCat(null)}
            />
            {data.c.map((c) => (
              <CategoryCard
                key={c.id}
                label={c.name}
                icon={c.emoji ?? '✨'}
                active={cat === c.id}
                onPress={() => setCat(cat === c.id ? null : c.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Filter / Search Feedback */}
        {(q || cat) && (
          <View style={s.searchFeedback}>
            <Text style={s.feedbackText}>
              Showing results for {q ? `"${q}"` : ''}{q && cat ? ' in ' : ''}
              {cat ? activeCategoryName : ''} ({view.items.length} items found)
            </Text>
          </View>
        )}

        {/* Featured / Popular Food Items Carousel */}
        {!q && !cat && view.popular.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>🔥</Text>
                <Text style={s.sectionTitle}>Popular in San Carlos City</Text>
              </View>
              <Text style={s.sectionBadge}>{view.popular.length} Best Sellers</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalFoodsScroll}>
              {view.popular.slice(0, 10).map((item) => (
                <View key={item.id} style={{ width: 230 }}>
                  <FoodCard
                    item={item}
                    qty={cart.qtyOf(item.id)}
                    variant="vertical"
                    subtitle={restOf(item.restaurant_id).name}
                    onPress={() => setModalItem(item)}
                    onAdd={() =>
                      cart.add(item, {
                        id: item.restaurant_id,
                        name: restOf(item.restaurant_id).name,
                      })
                    }
                    onRemove={() => cart.remove(item)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Food Items when category or query is selected */}
        {(q || cat) && view.items.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Text style={s.sectionTitle}>Matching Dishes</Text>
            <View style={{ gap: 12, marginTop: 10 }}>
              {view.items.map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  qty={cart.qtyOf(item.id)}
                  subtitle={restOf(item.restaurant_id).name}
                  onPress={() => setModalItem(item)}
                  onAdd={() =>
                    cart.add(item, {
                      id: item.restaurant_id,
                      name: restOf(item.restaurant_id).name,
                    })
                  }
                  onRemove={() => cart.remove(item)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Restaurants Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
          <View style={s.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18 }}>🏬</Text>
              <Text style={s.sectionTitle}>
                {q || cat ? 'Matching Restaurants' : 'Featured Restaurants'}
              </Text>
            </View>
            <Text style={s.sectionBadge}>{view.rests.length} Open Now</Text>
          </View>

          {view.rests.length === 0 && view.items.length === 0 ? (
            <EmptyState
              emoji="🔎"
              title="No food or restaurants found"
              hint="Try searching for another dish, burger, or clearing filters."
            />
          ) : (
            <View style={{ gap: 14, marginTop: 8 }}>
              {view.rests.map((r) => (
                <RestaurantCard
                  key={r.id}
                  r={r}
                  fav={favs.has(r.id)}
                  onFav={() => toggle(r.id)}
                  onPress={() => router.push(`/restaurant/${r.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Food Details Popup Modal */}
      <FoodDetailModal
        visible={modalItem !== null}
        item={modalItem}
        restaurant={modalItem ? restOf(modalItem.restaurant_id) : null}
        onClose={() => setModalItem(null)}
        onAddToCart={(item, qty) => {
          cart.add(
            item,
            { id: item.restaurant_id, name: restOf(item.restaurant_id).name },
            qty
          );
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
    scrollContent: {
      paddingBottom: 40,
    },
    promoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.coralSoft,
      marginHorizontal: 16,
      marginTop: 14,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.coral,
    },
    promoTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.coral,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      marginBottom: 6,
    },
    promoTagText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    promoTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.ink,
    },
    promoSub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
      lineHeight: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.ink,
    },
    sectionBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
    },
    clearFilterText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.coral,
    },
    categoriesScroll: {
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    searchFeedback: {
      paddingHorizontal: 16,
      marginTop: 8,
    },
    feedbackText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
    },
    horizontalFoodsScroll: {
      paddingHorizontal: 16,
      gap: 12,
      paddingVertical: 6,
    },
  })
);
