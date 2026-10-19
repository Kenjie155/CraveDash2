import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../hooks/useFavorites';
import { RestaurantCard } from '../../components/Cards';
import { Button, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Header } from '../../components/Header';
import { makeUseStyles, Text } from '../../lib/theme';
import type { Restaurant } from '../../lib/types';
import { SAMPLE_RESTAURANTS } from '../../lib/sampleCatalog';

export default function Favorites() {
  const s = useS();
  const router = useRouter();
  const { favs, toggle, reload } = useFavorites();
  const [rests, setRests] = useState<Restaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    await reload();

    try {
      const { data } = await supabase.from('restaurants').select('*');
      if (data && data.length > 0) {
        setRests(data as Restaurant[]);
      } else {
        setRests(SAMPLE_RESTAURANTS);
      }
    } catch {
      setRests(SAMPLE_RESTAURANTS);
    }
    setRefreshing(false);
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error) {
    return (
      <View style={s.screen}>
        <Header title="Favorites" />
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!rests) {
    return (
      <View style={s.screen}>
        <Header title="Favorites" />
        <LoadingState label="Loading favorites..." />
      </View>
    );
  }

  const mine = rests.filter((r) => favs.has(r.id));

  return (
    <View style={s.screen}>
      <Header title="Your Favorites" />

      {mine.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            emoji="🤍"
            title="No favorites yet"
            hint="Tap the heart icon on any restaurant in San Carlos City to save it here for fast re-ordering."
          />
          <View style={{ paddingHorizontal: 24, marginTop: -40 }}>
            <Button
              title="Explore Restaurants"
              onPress={() => router.push('/(tabs)')}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={load} />
          }>
          <Text style={s.sectionHeader}>Saved Places ({mine.length})</Text>
          {mine.map((r) => (
            <RestaurantCard
              key={r.id}
              r={r}
              fav
              onFav={() => toggle(r.id)}
              onPress={() => router.push(`/restaurant/${r.id}`)}
            />
          ))}
        </ScrollView>
      )}
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
    sectionHeader: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 12,
    },
  })
);
