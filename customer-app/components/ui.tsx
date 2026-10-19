import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { makeUseStyles, radius, Text, useColors } from '../lib/theme';

export function Button({ title, onPress, disabled, loading, variant = 'solid' }: {
  title: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: 'solid' | 'outline';
}) {
  const s = useS(); const colors = useColors();
  const off = disabled || loading;
  return (
    <Pressable accessibilityRole="button" disabled={off} onPress={onPress}
      style={[s.btn, variant === 'outline' && s.btnOutline, off && { opacity: 0.5 }]}>
      {loading ? <ActivityIndicator color={variant === 'outline' ? colors.coral : '#fff'} />
        : <Text style={[s.btnTxt, variant === 'outline' && { color: colors.coral }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const s = useS(); const colors = useColors();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#B5A89F" {...props} style={[s.input, error ? { borderColor: colors.red } : null, props.style]} />
      {error ? <Text style={s.err}>{error}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const s = useS(); const colors = useColors();
  return <View style={s.center}><ActivityIndicator color={colors.coral} size="large" /><Text style={s.muted}>{label}</Text></View>;
}
export function EmptyState({ emoji = '🍽️', title, hint }: { emoji?: string; title: string; hint?: string }) {
  const s = useS();
  return (
    <View style={s.center}><Text style={{ fontSize: 44 }}>{emoji}</Text><Text style={s.title}>{title}</Text>
      {hint ? <Text style={s.muted}>{hint}</Text> : null}</View>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const s = useS();
  return (
    <View style={s.center}><Text style={{ fontSize: 40 }}>⚠️</Text><Text style={s.title}>Something went wrong</Text>
      <Text style={[s.muted, { textAlign: 'center', marginBottom: 12 }]}>{message}</Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} /> : null}</View>
  );
}

const useS = makeUseStyles((colors) => StyleSheet.create({
  btn: { backgroundColor: colors.coral, paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.pill, alignItems: 'center' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.coral },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  label: { fontWeight: '700', color: colors.ink, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.input, padding: 13, fontSize: 15, color: colors.ink },
  err: { color: colors.red, marginTop: 4, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted },
}));
