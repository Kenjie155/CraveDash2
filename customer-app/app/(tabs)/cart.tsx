import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { CartItem } from '../../components/Cards';
import { Button, EmptyState } from '../../components/ui';
import { Header } from '../../components/Header';
import { makeUseStyles, money, radius, Text, useColors } from '../../lib/theme';

export default function Cart() {
  const colors = useColors();
  const s = useS();
  const router = useRouter();
  const cart = useCart();

  if (cart.lines.length === 0) {
    return (
      <View style={s.screen}>
        <Header title="Your Cart" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          hint="Looks like you haven't added anything yet. Explore delicious dishes in San Carlos City."
        />
        <View style={{ paddingHorizontal: 24, marginTop: -40 }}>
          <Button
            title="Explore Food Menu"
            onPress={() => router.push('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <Header title="Your Cart" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Merchant Info Card */}
        <View style={s.merchantCard}>
          <View style={s.merchantIcon}>
            <Ionicons name="storefront" size={20} color={colors.coral} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.merchantName}>From {cart.restaurant?.name}</Text>
            <Text style={s.merchantAddress}>
              San Carlos City, Negros Occidental
            </Text>
          </View>
          <Pressable
            onPress={cart.clear}
            hitSlop={8}
            style={s.clearBtn}
            accessibilityLabel="Clear all items">
            <Ionicons name="trash-outline" size={18} color={colors.red} />
          </Pressable>
        </View>

        {/* Cart Items List */}
        <View style={s.itemsSection}>
          <Text style={s.sectionTitle}>
            Order Items ({cart.count} item{cart.count > 1 ? 's' : ''})
          </Text>

          {cart.lines.map((l) => (
            <CartItem
              key={l.item.id}
              item={l.item}
              qty={l.qty}
              onAdd={() => cart.add(l.item, cart.restaurant!)}
              onRemove={() => cart.remove(l.item)}
            />
          ))}
        </View>

        {/* Pricing Summary Card */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Bill Summary</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryVal}>{money(cart.subtotal)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Estimated Delivery</Text>
            <Text style={s.summaryVal}>from ₱30.00</Text>
          </View>
          <Text style={s.deliveryNote}>
            Exact rider fee is calculated and confirmed upon checkout.
          </Text>

          <View style={s.divider} />

          <View style={s.summaryRow}>
            <Text style={s.totalLabel}>Items Total</Text>
            <Text style={s.totalVal}>{money(cart.subtotal)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionContainer}>
          <Button
            title={`Continue to Checkout • ${money(cart.subtotal)}`}
            onPress={() => router.push('/checkout')}
          />
          <View style={{ height: 10 }} />
          <Button
            title="Add More Items"
            variant="outline"
            onPress={() => router.push('/(tabs)')}
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
    merchantCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.line,
    },
    merchantIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.coralSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    merchantName: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
    },
    merchantAddress: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    clearBtn: {
      padding: 6,
    },
    itemsSection: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 12,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      marginBottom: 20,
      gap: 8,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 6,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    summaryVal: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    deliveryNote: {
      fontSize: 11,
      color: colors.muted,
      fontStyle: 'italic',
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: 4,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
    },
    totalVal: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.coral,
    },
    actionContainer: {
      gap: 4,
    },
  })
);
