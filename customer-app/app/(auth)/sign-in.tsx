import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Field } from '../../components/ui';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { makeUseStyles, radius, Text, useColors } from '../../lib/theme';

export default function SignIn() {
  const colors = useColors();
  const s = useS();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <View style={s.screen}>
      <Header showBack title="Sign In" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Welcome back to CraveDash</Text>
        <Text style={s.subheading}>
          Sign in to order delicious food across San Carlos City
        </Text>

        <View style={s.formCard}>
          <Field
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
          />

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Button title="Sign In" onPress={submit} loading={busy} />
        </View>

        <Link
          href="/(auth)/forgot-password"
          style={s.forgotLink}>
          Forgot password?
        </Link>

        <View style={s.footerRow}>
          <Text style={{ color: colors.muted }}>New to CraveDash?</Text>
          <Link href="/(auth)/sign-up" style={s.signUpLink}>
            Create an account
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
    forgotLink: {
      color: colors.coral,
      fontWeight: '800',
      textAlign: 'center',
      marginVertical: 10,
      fontSize: 14,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
    },
    signUpLink: {
      color: colors.coral,
      fontWeight: '800',
    },
  })
);
