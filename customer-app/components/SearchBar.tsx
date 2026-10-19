import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, radius, useColors } from '../lib/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  onFilterPress,
  hasActiveFilters = false,
  placeholder = 'Search dishes, restaurants, categories...',
  autoFocus = false,
  style,
}: SearchBarProps) {
  const colors = useColors();
  const s = useS();

  return (
    <View style={[s.container, style]}>
      <Ionicons name="search-outline" size={19} color={colors.coral} style={s.icon} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        style={[s.input, { color: colors.ink }]}
      />

      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={8}
          style={s.clearBtn}>
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      )}

      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          style={[s.filterBtn, hasActiveFilters && s.filterBtnActive]}>
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilters ? '#fff' : colors.ink}
          />
        </Pressable>
      )}
    </View>
  );
}

const useS = makeUseStyles((colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.card,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 12,
      height: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    icon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      height: '100%',
      fontWeight: '600',
    },
    clearBtn: {
      padding: 4,
    },
    filterBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.coralSoft,
      marginLeft: 6,
    },
    filterBtnActive: {
      backgroundColor: colors.coral,
    },
  })
);
