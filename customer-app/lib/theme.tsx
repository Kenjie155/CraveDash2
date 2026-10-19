import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Pressable, Text as RNText, TextProps } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  ink: '#241B16', muted: '#7B6E66', bg: '#FFF9F4', card: '#FFFFFF',
  coral: '#F2542D', coralSoft: '#FFE6DD', line: '#F0E3D8', green: '#1E9E5A', red: '#C62828',
};
export type Colors = typeof lightColors;
export const darkColors: Colors = {
  ink: '#F6EEE8', muted: '#B5A89F', bg: '#16110E', card: '#241C17',
  coral: '#FF6B45', coralSoft: '#3A2A22', line: '#3A2F28', green: '#3DBB7A', red: '#EF6B6B',
};
export const colors = lightColors; // static fallback; components use useColors()
export const radius = { card: 18, pill: 999, input: 14 };
export const money = (n: number | string) =>
  `₱${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

// Fallback map center: San Carlos City, Negros Occidental, Philippines
export const DEFAULT_CENTER = { latitude: 10.4837, longitude: 123.4129 };

type Mode = 'light' | 'dark';
const KEY = 'cravedash-theme';
const Ctx = createContext<{ mode: Mode; colors: Colors; toggle: () => void }>({
  mode: 'light', colors: lightColors, toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v === 'dark' || v === 'light') setMode(v); }).catch(() => {});
  }, []);
  const value = useMemo(() => ({
    mode, colors: mode === 'dark' ? darkColors : lightColors,
    toggle: () => setMode((m) => {
      const next: Mode = m === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(KEY, next).catch(() => {});
      return next;
    }),
  }), [mode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
export const useColors = () => useContext(Ctx).colors;

// Builds a hook that returns styles for the current theme.
export function makeUseStyles<T>(fn: (c: Colors) => T) {
  return () => { const c = useColors(); return useMemo(() => fn(c), [c]); };
}

// Text that defaults to the theme's text color.
export function Text(props: TextProps) {
  const c = useColors();
  return <RNText {...props} style={[{ color: c.ink }, props.style]} />;
}

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Switch dark mode" hitSlop={10} style={{ marginRight: 14 }}>
      <RNText style={{ fontSize: 20 }}>{mode === 'dark' ? '☀️' : '🌙'}</RNText>
    </Pressable>
  );
}
