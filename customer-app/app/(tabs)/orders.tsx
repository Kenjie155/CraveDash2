import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Button, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Header } from '../../components/Header';
import { makeUseStyles, money, radius, Text, useColors } from '../../lib/theme';
import { STATUS_STEPS } from '../../lib/types';

type Row = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
  restaurants: { name: string } | null;
};

export default function Orders() {
  const colors = useColors();
  const s = useS();
  const router = useRouter();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const { data, error: e } = await supabase
        .from('orders')
        .select('id,order_number,status,total,created_at,restaurants(name)')
        .order('created_at', { ascending: false });

      if (e) setError(e.message);
      else setRows((data ?? []) as unknown as Row[]);
    } catch {
      setRows([]);
    }
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error) {
    return (
      <View style={s.screen}>
        <Header title="My Orders" />
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!rows) {
    return (
      <View style={s.screen}>
        <Header title="My Orders" />
        <LoadingState label="Loading orders..." />
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={s.screen}>
        <Header title="My Orders" />
        <EmptyState
          emoji="🧾"
          title="No orders yet"
          hint="When you place orders in San Carlos City, they will appear here with live tracking status."
        />
        <View style={{ paddingHorizontal: 24, marginTop: -40 }}>
          <Button
            title="Browse Restaurants"
            onPress={() => router.push('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'out_for_delivery':
      case 'picked_up':
        return '#F2542D';
      default:
        return '#F59E0B';
    }
  };

  const getStatusLabel = (s: string) =>
    s === 'cancelled'
      ? 'Cancelled'
      : STATUS_STEPS.find((x) => x.key === s)?.label ?? s.toUpperCase();

  return (
    <View style={s.screen}>
      <Header title="My Orders" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} />
        }>
        {rows.map((o) => {
          const statusColor = getStatusColor(o.status);

          return (
            <Pressable
              key={o.id}
              onPress={() => router.push(`/order/${o.id}`)}
              style={s.orderCard}>
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.orderNumber}>Order #{o.order_number}</Text>
                  <Text style={s.orderDate}>
                    {new Date(o.created_at).toLocaleDateString()} at{' '}
                    {new Date(o.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View
                  style={[
                    s.statusPill,
                    { backgroundColor: `${statusColor}18` },
                  ]}>
                  <Text style={[s.statusText, { color: statusColor }]}>
                    {getStatusLabel(o.status)}
                  </Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.cardFooter}>
                <View style={s.restInfo}>
                  <Ionicons name="storefront-outline" size={16} color={colors.muted} />
                  <Text style={s.restName} numberOfLines={1}>
                    {o.restaurants?.name ?? 'Partner Restaurant'}
                  </Text>
                </View>

                <View style={s.priceBox}>
                  <Text style={s.totalAmount}>{money(o.total)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </View>
              </View>
            </Pressable>
          );
        })}
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
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.line,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
    },
    orderDate: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    restInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    restName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
    },
    priceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    totalAmount: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.coral,
    },
  })
);
