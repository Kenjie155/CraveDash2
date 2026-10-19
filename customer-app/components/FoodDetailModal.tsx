import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, money, radius, Text, useColors } from '../lib/theme';
import type { MenuItem, Restaurant } from '../lib/types';
import { FoodImage } from '../lib/foodImages';
import { Button } from './ui';

export interface FoodDetailModalProps {
  visible: boolean;
  item: MenuItem | null;
  restaurant?: Restaurant | { id: string; name: string } | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, qty: number) => void;
}

export function FoodDetailModal({
  visible,
  item,
  restaurant,
  onClose,
  onAddToCart,
}: FoodDetailModalProps) {
  const colors = useColors();
  const s = useS();
  const [qty, setQty] = useState(1);

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, qty);
    setQty(1);
    onClose();
  };

  const totalPrice = Number(item.price) * qty;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modalContainer}>
          {/* Header Bar */}
          <View style={s.modalHeader}>
            <Pressable
              onPress={onClose}
              style={s.closeBtn}
              accessibilityLabel="Close food details">
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
            <Text style={s.headerTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={s.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={s.imageWrapper}>
              <FoodImage
                id={item.id}
                uri={item.image_url}
                name={item.name}
                category_id={item.category_id}
                width="100%"
                height={220}
                borderRadius={0}
                style={s.heroImage}
                resizeMode="cover"
              />
              {item.tag && (
                <View style={s.tagBadge}>
                  <Text style={s.tagText}>{item.tag}</Text>
                </View>
              )}
            </View>

            {/* Food Info */}
            <View style={s.body}>
              <View style={s.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.foodName}>{item.name}</Text>
                  {restaurant && (
                    <Text style={s.restName}>{restaurant.name}</Text>
                  )}
                </View>
                <View style={s.priceBox}>
                  <Text style={s.price}>{money(item.price)}</Text>
                  {item.original_price && (
                    <Text style={s.originalPrice}>{money(item.original_price)}</Text>
                  )}
                </View>
              </View>

              {/* Meta stats */}
              <View style={s.metaRow}>
                <View style={s.ratingBadge}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={s.ratingText}>
                    {item.rating ? item.rating.toFixed(1) : '4.8'}
                  </Text>
                </View>
                <View style={s.metaDot} />
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={s.metaText}>{item.prep_time ?? '15-20 min'}</Text>
                <View style={s.metaDot} />
                <Text style={[s.metaText, { color: colors.green, fontWeight: '700' }]}>
                  {item.is_available ? 'Available' : 'Sold Out'}
                </Text>
              </View>

              {/* Description */}
              <Text style={s.sectionHeader}>Description</Text>
              <Text style={s.description}>{item.description}</Text>

              {/* Ingredients list if present */}
              {item.ingredients && item.ingredients.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <Text style={s.sectionHeader}>Key Ingredients</Text>
                  <View style={s.ingredientsGrid}>
                    {item.ingredients.map((ing, idx) => (
                      <View key={idx} style={s.ingChip}>
                        <Ionicons name="checkmark-circle" size={13} color={colors.coral} />
                        <Text style={s.ingText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Stepper */}
              <View style={s.quantitySection}>
                <Text style={s.sectionHeader}>Quantity</Text>
                <View style={s.stepperWrapper}>
                  <Pressable
                    disabled={qty <= 1}
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                    style={[s.stepBtn, qty <= 1 && { opacity: 0.4 }]}>
                    <Text style={s.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={s.qtyDisplay}>{qty}</Text>
                  <Pressable
                    onPress={() => setQty((q) => q + 1)}
                    style={s.stepBtn}>
                    <Text style={s.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Bar */}
          <View style={s.footer}>
            <View>
              <Text style={s.footerSub}>Total Price</Text>
              <Text style={s.footerTotal}>{money(totalPrice)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Button
                title={`Add ${qty} to Cart`}
                onPress={handleAdd}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '90%',
      minHeight: 520,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.ink,
      flex: 1,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    contentScroll: {
      paddingBottom: 24,
    },
    imageWrapper: {
      height: 220,
      width: '100%',
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    emojiFallback: {
      backgroundColor: colors.coralSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagBadge: {
      position: 'absolute',
      bottom: 12,
      left: 14,
      backgroundColor: colors.coral,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    tagText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    body: {
      padding: 16,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    foodName: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.ink,
    },
    restName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.coral,
      marginTop: 2,
    },
    priceBox: {
      alignItems: 'flex-end',
    },
    price: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.coral,
    },
    originalPrice: {
      fontSize: 13,
      color: colors.muted,
      textDecorationLine: 'line-through',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      marginBottom: 14,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
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
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.ink,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    description: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    ingredientsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    ingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
    },
    ingText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    },
    quantitySection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    stepperWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.coralSoft,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnText: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.coral,
    },
    qtyDisplay: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      minWidth: 20,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    footerSub: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
      textTransform: 'uppercase',
    },
    footerTotal: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.coral,
    },
  })
);
