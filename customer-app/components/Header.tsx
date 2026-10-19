import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, Text, ThemeToggle, useColors } from '../lib/theme';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  locationTitle?: string;
  onLocationPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  leftAction,
  locationTitle,
  onLocationPress,
  style,
}: HeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const s = useS();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[s.container, style]}>
      <View style={s.leftContainer}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={s.backBtn}
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
        ) : leftAction ? (
          leftAction
        ) : null}

        {locationTitle ? (
          <Pressable
            onPress={onLocationPress}
            style={s.locationWrapper}
            accessibilityRole="button"
            accessibilityLabel="Delivery location">
            <View style={s.locationSubRow}>
              <Ionicons name="location-sharp" size={14} color={colors.coral} />
              <Text style={s.locationSubtext}>Deliver to</Text>
              <Ionicons name="chevron-down" size={12} color={colors.muted} />
            </View>
            <Text style={s.locationText} numberOfLines={1}>
              {locationTitle}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!locationTitle && title ? (
        <View style={s.titleContainer}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={s.rightContainer}>
        {rightAction ? rightAction : <ThemeToggle />}
      </View>
    </View>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.bg,
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.line,
    },
    locationWrapper: {
      marginLeft: 4,
      flex: 1,
    },
    locationSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationSubtext: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    locationText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.ink,
      marginTop: 1,
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.ink,
    },
    subtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 40,
    },
  })
);
