import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Field } from '../../components/ui';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { makeUseStyles, radius, Text, useColors } from '../../lib/theme';

export default function ForgotPassword() {
  const colors = useColors();
  const s = useS();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setMsg({ ok: false, text: 'Enter a valid email address.' });
    }
    setBusy(true);
    const err = await resetPassword(email);
    setMsg(
      err
        ? { ok: false, text: err }
        : { ok: true, text: 'If that email has an account, a reset link is on its way.' }
    );
    setBusy(false);
  };

  return (
    <View style={s.screen}>
      <Header showBack title="Reset Password" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Forgot your password?</Text>
        <Text style={s.subheading}>
          Enter your registered email address and we will send you instructions to reset your password.
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

          {msg && (
            <View
              style={[
                s.feedbackBox,
                { backgroundColor: msg.ok ? '#ECFDF5' : '#FEF2F2' },
              ]}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: msg.ok ? colors.green : colors.red,
                }}>
                {msg.text}
              </Text>
            </View>
          )}

          <Button title="Send Reset Link" onPress={submit} loading={busy} />
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
    },
    feedbackBox: {
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
    },
  })
);
