import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, makeUseStyles, useColors } from '../lib/theme';
import { OrderStatus, STATUS_STEPS } from '../lib/types';

export function OrderStatusTracker({ status }: { status: OrderStatus }) {
  const s = useS(); const colors = useColors();
  if (status === 'cancelled') return <View style={s.cancel}><Text style={s.cancelTxt}>This order was cancelled</Text></View>;
  const idx = STATUS_STEPS.findIndex((x) => x.key === status);
  return (
    <View>
      {STATUS_STEPS.map((st, i) => (
        <View key={st.key} style={s.row}>
          <View style={{ alignItems: 'center' }}>
            <View style={[s.dot, i <= idx && s.dotOn]}>{i <= idx ? <Text style={s.tick}>✓</Text> : null}</View>
            {i < STATUS_STEPS.length - 1 ? <View style={[s.bar, i < idx && { backgroundColor: colors.coral }]} /> : null}
          </View>
          <Text style={[s.label, i === idx && { color: colors.coral, fontWeight: '800' }, i > idx && { color: colors.muted }]}>{st.label}</Text>
        </View>
      ))}
    </View>
  );
}

const useS = makeUseStyles((colors) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, minHeight: 34 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.coral },
  tick: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bar: { width: 2, flex: 1, backgroundColor: colors.line, minHeight: 14 },
  label: { fontSize: 14, color: colors.ink, paddingTop: 1 },
  cancel: { backgroundColor: colors.coralSoft, padding: 12, borderRadius: 12 },
  cancelTxt: { color: colors.red, fontWeight: '800' },
}));
