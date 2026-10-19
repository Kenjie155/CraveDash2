import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui';
import { Header } from '../../components/Header';
import { makeUseStyles, radius, Text, useColors, useTheme } from '../../lib/theme';

export default function Profile() {
  const colors = useColors();
  const s = useS();
  const router = useRouter();
  const { mode, toggle } = useTheme();
  const { user, signOut } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('full_name,phone')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setName(data.full_name ?? '');
            setPhone(data.phone ?? '');
          }
        });
    }, [user])
  );

  const save = async () => {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        setMsg({ text: error.message, isError: true });
      } else {
        setMsg({ text: 'Profile changes saved successfully.' });
      }
    } catch {
      setMsg({ text: 'Failed to update profile. Please try again.', isError: true });
    }
    setBusy(false);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to sign out of CraveDash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
        },
      },
    ]);
  };

  const initials = (name || user?.email || 'CD')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={s.screen}>
      <Header title="My Account" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* User Card */}
        <View style={s.userCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{name || 'CraveDash Customer'}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
            <View style={s.locationTag}>
              <Ionicons name="location-sharp" size={12} color={colors.coral} />
              <Text style={s.locationTagText}>San Carlos City, Negros Occidental</Text>
            </View>
          </View>
        </View>

        {/* Section: Profile Form */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Account Details</Text>
          <Field
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
          />
          <Field
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="0917 123 4567"
            keyboardType="phone-pad"
          />

          {msg && (
            <View
              style={[
                s.feedbackBox,
                { backgroundColor: msg.isError ? '#FEF2F2' : '#ECFDF5' },
              ]}>
              <Ionicons
                name={msg.isError ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={msg.isError ? colors.red : colors.green}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: msg.isError ? colors.red : colors.green,
                }}>
                {msg.text}
              </Text>
            </View>
          )}

          <Button title="Save Profile Changes" onPress={save} loading={busy} />
        </View>

        {/* Section: Preferences */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Preferences</Text>

          <View style={s.prefRow}>
            <View style={s.prefInfo}>
              <Ionicons
                name={mode === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.coral}
              />
              <View>
                <Text style={s.prefTitle}>Dark Mode</Text>
                <Text style={s.prefSub}>
                  {mode === 'dark' ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggle}
              trackColor={{ true: colors.coral, false: colors.line }}
            />
          </View>

          <View style={s.divider} />

          <Pressable
            onPress={() => router.push('/(tabs)/orders')}
            style={s.linkRow}>
            <View style={s.prefInfo}>
              <Ionicons name="receipt-outline" size={20} color={colors.ink} />
              <Text style={s.prefTitle}>Order History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <View style={s.divider} />

          <Pressable
            onPress={() => router.push('/(tabs)/favorites')}
            style={s.linkRow}>
            <View style={s.prefInfo}>
              <Ionicons name="heart-outline" size={20} color={colors.coral} />
              <Text style={s.prefTitle}>Favorite Restaurants</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Section: App Info & Logout */}
        <View style={s.card}>
          <View style={s.appInfoRow}>
            <Text style={s.appVersion}>CraveDash v1.0.0 · San Carlos City Edition</Text>
          </View>
          <Button
            title="Log Out of CraveDash"
            variant="outline"
            onPress={handleLogout}
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
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.line,
    },
    avatarCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.coral,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '900',
      color: '#fff',
    },
    userName: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.ink,
    },
    userEmail: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    locationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    locationTagText: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.line,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 14,
    },
    feedbackBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
    },
    prefRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    prefInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    prefTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.ink,
    },
    prefSub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: 12,
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    appInfoRow: {
      alignItems: 'center',
      marginBottom: 12,
    },
    appVersion: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
  })
);
