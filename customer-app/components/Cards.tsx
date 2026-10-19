import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, money, radius, Text, useColors } from '../lib/theme';
import type { MenuItem, Restaurant, Rider } from '../lib/types';
import { FoodImage } from '../lib/foodImages';

const Pic = ({
  id,
  uri,
  name,
  category_id,
  size = 76,
  borderRadius = 16,
  style,
}: {
  id?: string | null;
  uri?: string | null;
  emoji?: string | null;
  name?: string | null;
  category_id?: string | null;
  size?: number;
  borderRadius?: number;
  style?: object;
}) => {
  return (
    <FoodImage
      id={id}
      uri={uri}
      name={name}
      category_id={category_id}
      size={size}
      borderRadius={borderRadius}
      style={style as any}
      resizeMode="cover"
    />
  );
};

export function CategoryCard({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
}) {
  const s = useS();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[s.chip, active && s.chipOn]}>
      {icon ? <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text> : null}
      <Text style={[s.chipTxt, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function RestaurantCard({
  r,
  fav,
  onFav,
  onPress,
}: {
  r: Restaurant;
  fav: boolean;
  onFav: () => void;
  onPress: () => void;
}) {
  const s = useS();
  const colors = useColors();

  return (
    <Pressable onPress={onPress} style={s.restCard} accessibilityRole="button">
      <View style={s.restImageContainer}>
        <Image
          source={{
            uri:
              r.image_url && r.image_url.startsWith('http')
                ? r.image_url
                : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
          }}
          style={s.restImage}
          resizeMode="cover"
        />

        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            onFav();
          }}
          hitSlop={10}
          style={s.favBtn}
          accessibilityLabel="Toggle favorite">
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={18}
            color={fav ? colors.red : '#fff'}
          />
        </Pressable>

        <View style={s.restBadgeRow}>
          <View style={s.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={s.ratingText}>{Number(r.rating).toFixed(1)}</Text>
          </View>
          <View style={s.timeBadge}>
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text style={s.timeText}>{r.delivery_time_min} mins</Text>
          </View>
        </View>
      </View>

      <View style={s.restInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={s.restName} numberOfLines={1}>
            {r.name}
          </Text>
          <View style={[s.statusPill, { backgroundColor: r.is_open ? '#ECFDF5' : '#FEF2F2' }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: r.is_open ? '#10B981' : '#EF4444' }}>
              {r.is_open ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        <Text style={s.desc} numberOfLines={1}>
          {r.description}
        </Text>

        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={s.locationText} numberOfLines={1}>
            {r.address ?? 'San Carlos City, Negros Occidental'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function FoodCard({
  item,
  qty,
  onAdd,
  onRemove,
  onPress,
  subtitle,
  variant = 'vertical',
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onPress?: () => void;
  subtitle?: string;
  variant?: 'vertical' | 'horizontal';
}) {
  const s = useS();
  const colors = useColors();

  if (variant === 'horizontal') {
    return (
      <Pressable onPress={onPress} style={s.hCard}>
        <View style={s.hImageWrapper}>
          <Pic
            id={item.id}
            uri={item.image_url}
            name={item.name}
            category_id={item.category_id}
            size={100}
            borderRadius={0}
            style={s.hImage}
          />
          {item.tag && (
            <View style={s.hTagBadge}>
              <Text style={s.hTagText}>{item.tag}</Text>
            </View>
          )}
        </View>

        <View style={s.hContent}>
          <View>
            <Text style={s.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={s.desc} numberOfLines={2}>
              {subtitle ?? item.description}
            </Text>
          </View>

          <View style={s.hMetaRow}>
            {item.rating && (
              <View style={s.metaRating}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={s.metaRatingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
            {item.prep_time && (
              <Text style={s.metaPrep}>· {item.prep_time}</Text>
            )}
          </View>

          <View style={s.hBottomRow}>
            <View style={s.priceWrapper}>
              <Text style={s.price}>{money(item.price)}</Text>
              {item.original_price && (
                <Text style={s.originalPrice}>{money(item.original_price)}</Text>
              )}
            </View>

            {qty === 0 ? (
              <Pressable
                style={s.addBtnSmall}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onAdd();
                }}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addTxtSmall}>Add</Text>
              </Pressable>
            ) : (
              <View style={s.stepperSmall}>
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onRemove();
                  }}
                  hitSlop={8}>
                  <Text style={s.stepSmall}>−</Text>
                </Pressable>
                <Text style={s.stepperQtySmall}>{qty}</Text>
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onAdd();
                  }}
                  hitSlop={8}>
                  <Text style={s.stepSmall}>+</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  // Vertical card
  return (
    <Pressable onPress={onPress} style={s.card}>
      <View style={{ position: 'relative' }}>
        <Pic
          id={item.id}
          uri={item.image_url}
          name={item.name}
          category_id={item.category_id}
          size={78}
        />
        {item.tag && (
          <View style={s.vTagBadge}>
            <Text style={s.vTagText}>{item.tag}</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={s.desc} numberOfLines={2}>
          {subtitle ?? item.description}
        </Text>

        <View style={s.priceContainer}>
          <Text style={s.price}>{money(item.price)}</Text>
          {item.original_price && (
            <Text style={s.originalPrice}>{money(item.original_price)}</Text>
          )}
          {item.rating ? (
            <View style={s.starBadge}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={s.starBadgeText}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {qty === 0 ? (
        <Pressable
          style={s.add}
          onPress={(e) => {
            e?.stopPropagation?.();
            onAdd();
          }}>
          <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 2 }} />
          <Text style={s.addTxt}>Add</Text>
        </Pressable>
      ) : (
        <View style={s.stepper}>
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              onRemove();
            }}
            hitSlop={8}>
            <Text style={s.step}>−</Text>
          </Pressable>
          <Text style={{ fontWeight: '800', color: colors.ink }}>{qty}</Text>
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              onAdd();
            }}
            hitSlop={8}>
            <Text style={s.step}>+</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export function CartItem({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const s = useS();
  return (
    <View style={s.cartCard}>
      <Pic
        id={item.id}
        uri={item.image_url}
        name={item.name}
        category_id={item.category_id}
        size={56}
        borderRadius={12}
      />
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={s.unitPrice}>
          {money(item.price)} each
        </Text>
        <Text style={s.price}>{money(Number(item.price) * qty)}</Text>
      </View>
      <View style={s.stepper}>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={s.step}>−</Text>
        </Pressable>
        <Text style={{ fontWeight: '800' }}>{qty}</Text>
        <Pressable onPress={onAdd} hitSlop={8}>
          <Text style={s.step}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RiderCard({
  rider,
  selected,
  onSelect,
}: {
  rider: Rider;
  selected: boolean;
  onSelect: () => void;
}) {
  const s = useS();
  const colors = useColors();
  const initials = rider.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <Pressable
      disabled={!rider.is_available}
      onPress={onSelect}
      style={[
        s.riderCard,
        selected && { borderColor: colors.coral, borderWidth: 2, backgroundColor: colors.coralSoft },
        !rider.is_available && { opacity: 0.55 },
      ]}>
      {rider.avatar_url ? (
        <Image source={{ uri: rider.avatar_url }} style={s.avatar} />
      ) : (
        <View
          style={[
            s.avatar,
            { backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center' },
          ]}>
          <Text style={{ fontWeight: '800', color: colors.coral, fontSize: 16 }}>{initials}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.name}>{rider.full_name}</Text>
          <View style={s.starBadge}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={s.starBadgeText}>{Number(rider.rating).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={s.meta}>
          {rider.vehicle_type} · {rider.completed_deliveries} deliveries
        </Text>
        <Text style={s.meta}>
          ~{rider.eta_minutes} mins ·{' '}
          <Text style={{ fontWeight: '800', color: colors.coral }}>
            {rider.base_fee > 0 ? money(rider.base_fee) : 'Free Delivery'}
          </Text>
        </Text>
      </View>

      <View
        style={[
          s.selectBadge,
          selected && { backgroundColor: colors.green },
          !rider.is_available && { backgroundColor: colors.muted },
        ]}>
        <Ionicons
          name={selected ? 'checkmark' : 'chevron-forward'}
          size={16}
          color="#fff"
        />
      </View>
    </Pressable>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    pic: {
      backgroundColor: colors.coralSoft,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: colors.line,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.card,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.line,
    },
    chipOn: {
      backgroundColor: colors.coral,
      borderColor: colors.coral,
      shadowColor: colors.coral,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    chipTxt: {
      fontWeight: '800',
      fontSize: 13,
      color: colors.ink,
    },
    restCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
    },
    restImageContainer: {
      height: 140,
      width: '100%',
      position: 'relative',
    },
    restImage: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.coralSoft,
    },
    favBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restBadgeRow: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      flexDirection: 'row',
      gap: 6,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    ratingText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '800',
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    timeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    restInfo: {
      padding: 14,
    },
    restName: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.ink,
      flex: 1,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    locationText: {
      fontSize: 12,
      color: colors.muted,
      flex: 1,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.line,
    },
    hCard: {
      width: 220,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
    },
    hImageWrapper: {
      height: 120,
      width: '100%',
      position: 'relative',
    },
    hImage: {
      width: '100%',
      height: 120,
      borderRadius: 0,
    },
    hTagBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.coral,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    hTagText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    vTagBadge: {
      position: 'absolute',
      bottom: -4,
      left: 4,
      right: 4,
      backgroundColor: colors.coral,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      alignItems: 'center',
    },
    vTagText: {
      color: '#fff',
      fontSize: 8,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    hContent: {
      padding: 10,
      gap: 4,
    },
    hMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginVertical: 2,
    },
    metaRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    metaRatingText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.ink,
    },
    metaPrep: {
      fontSize: 11,
      color: colors.muted,
    },
    hBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    priceWrapper: {
      flexDirection: 'column',
    },
    addBtnSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.coral,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    addTxtSmall: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 12,
    },
    stepperSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.coralSoft,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    stepSmall: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.coral,
      paddingHorizontal: 2,
    },
    stepperQtySmall: {
      fontWeight: '800',
      fontSize: 12,
      color: colors.ink,
    },
    cartCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.line,
    },
    unitPrice: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    riderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.line,
    },
    selectBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      fontWeight: '900',
      fontSize: 15,
      color: colors.ink,
    },
    desc: {
      color: colors.muted,
      fontSize: 12,
      marginVertical: 2,
      lineHeight: 16,
    },
    meta: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    price: {
      color: colors.coral,
      fontWeight: '900',
      fontSize: 15,
    },
    originalPrice: {
      color: colors.muted,
      fontSize: 12,
      textDecorationLine: 'line-through',
    },
    starBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.coralSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 4,
    },
    starBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.ink,
    },
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.coral,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.pill,
    },
    addTxt: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 13,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.coralSoft,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    step: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.coral,
      paddingHorizontal: 4,
    },
  })
);
