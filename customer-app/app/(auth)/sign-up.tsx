import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Field } from '../../components/ui';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { makeUseStyles, radius, Text, useColors } from '../../lib/theme';

export default function SignUp() {
  const colors = useColors();
  const s = useS();
  const { signUp } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
    if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number.';
    if (f.password.length < 8) e.password = 'Use at least 8 characters.';
    if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    setMsg(null);
    if (Object.keys(e).length) return;

    setBusy(true);
    const r = await signUp(f);
    if (r.error) setErrors({ form: r.error });
    else if (r.needsConfirm) setMsg('Account created. Check your email to confirm it, then sign in.');
    setBusy(false);
  };

  return (
    <View style={s.screen}>
      <Header showBack title="Create Account" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Join CraveDash San Carlos</Text>
        <Text style={s.subheading}>
          Create an account to start ordering delicious food and enjoy fast doorstep delivery.
        </Text>

        <View style={s.formCard}>
          <Field
            label="Full Name"
            value={f.name}
            onChangeText={set('name')}
            placeholder="Your full name"
            error={errors.name}
          />
          <Field
            label="Email Address"
            value={f.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            error={errors.email}
          />
          <Field
            label="Phone Number"
            value={f.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            placeholder="0917 123 4567"
            error={errors.phone}
          />
          <Field
            label="Password (min 8 characters)"
            value={f.password}
            onChangeText={set('password')}
            secureTextEntry
            placeholder="Create password"
            error={errors.password}
          />
          <Field
            label="Confirm Password"
            value={f.confirm}
            onChangeText={set('confirm')}
            secureTextEntry
            placeholder="Re-enter password"
            error={errors.confirm}
          />

          {errors.form && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{errors.form}</Text>
            </View>
          )}

          {msg && (
            <View style={s.successBox}>
              <Text style={s.successText}>{msg}</Text>
            </View>
          )}

          <Button title="Create Account" onPress={submit} loading={busy} />
        </View>

        <View style={s.footerRow}>
          <Text style={{ color: colors.muted }}>Already have an account?</Text>
          <Link href="/(auth)/sign-in" style={s.signInLink}>
            Sign in
          </Link>
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
      padding: 20,
    },
    heading: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.ink,
      marginBottom: 6,
    },
    subheading: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
      marginBottom: 20,
    },
    formCard: {
      backgroundColor: colors.card,
      padding: 18,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.line,
      marginBottom: 16,
    },
    errorBox: {
      backgroundColor: '#FEF2F2',
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    errorText: {
      color: colors.red,
      fontSize: 13,
      fontWeight: '600',
    },
    successBox: {
      backgroundColor: '#ECFDF5',
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#6EE7B7',
    },
    successText: {
      color: colors.green,
      fontSize: 13,
      fontWeight: '700',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: 10,
      marginBottom: 24,
    },
    signInLink: {
      color: colors.coral,
      fontWeight: '800',
    },
  })
);
