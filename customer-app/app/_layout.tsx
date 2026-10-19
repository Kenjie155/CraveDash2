import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { isConfigured } from '../lib/supabase';
import { LoadingState } from '../components/ui';
import { Text, ThemeProvider, useColors, useTheme } from '../lib/theme';

function Gate() {
  const { session, loading } = useAuth();
  const colors = useColors();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const open = segments[0] === 'welcome' || segments[0] === '(auth)';
    if (!session && !open) router.replace('/welcome');
    else if (session && open) router.replace('/(tabs)');
  }, [session, loading, segments, router]);

  if (loading) return <LoadingState />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

function Shell() {
  const { mode } = useTheme();
  const colors = useColors();
  if (!isConfigured) {
    return (
      <View style={{ flex: 1, padding: 28, justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Supabase is not configured</Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          Copy .env.example to .env in customer-app, fill in EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart with: npx expo start -c
        </Text>
      </View>
    );
  }
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Gate />
      </CartProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
