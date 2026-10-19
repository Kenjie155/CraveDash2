import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { makeUseStyles, radius, Text, useColors } from '../lib/theme';

export default function Welcome() {
  const s = useS();
  const colors = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.hero}>
        <View style={s.logo}>
          <Text style={s.logoTxt}>C</Text>
        </View>

        <Text style={s.brand}>CraveDash</Text>

        <View style={s.cityBadge}>
          <Ionicons name="location-sharp" size={13} color={colors.coral} />
          <Text style={s.cityBadgeText}>San Carlos City · Negros Occidental</Text>
        </View>

        <Text style={s.tag}>
          Delicious local food from restaurants you love, delivered hot & fresh to your door.
        </Text>

        {/* Feature Pills */}
        <View style={s.featureGrid}>
          <View style={s.featureItem}>
            <Ionicons name="map-outline" size={16} color={colors.coral} />
            <Text style={s.featureText}>Real San Carlos Map</Text>
          </View>
          <View style={s.featureItem}>
            <Ionicons name="cash-outline" size={16} color={colors.green} />
            <Text style={s.featureText}>Cash on Delivery</Text>
          </View>
          <View style={s.featureItem}>
            <Ionicons name="fast-food-outline" size={16} color="#FFB300" />
            <Text style={s.featureText}>35+ Diverse Dishes</Text>
          </View>
        </View>
      </View>

      <View style={s.actionBlock}>
        <Button
          title="Create New Account"
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Button
          title="I Already Have an Account"
          variant="outline"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </View>
    </SafeAreaView>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      width: 96,
      height: 96,
      borderRadius: 30,
      backgroundColor: colors.coral,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '-8deg' }],
      shadowColor: colors.coral,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    logoTxt: {
      color: '#fff',
      fontSize: 56,
      fontWeight: '900',
    },
    brand: {
      fontSize: 40,
      fontWeight: '900',
      color: colors.ink,
      marginTop: 20,
      letterSpacing: -0.5,
    },
    cityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.coralSoft,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.pill,
      marginTop: 8,
      marginBottom: 12,
    },
    cityBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.coral,
    },
    tag: {
      color: colors.muted,
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 22,
      maxWidth: 300,
    },
    featureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
    },
    featureText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.ink,
    },
    actionBlock: {
      gap: 12,
      padding: 24,
      paddingBottom: 36,
    },
  })
);
