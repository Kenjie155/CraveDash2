import { Stack } from 'expo-router';
import { useColors } from '../../lib/theme';

export default function AuthLayout() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false, headerTintColor: colors.ink, title: '', contentStyle: { backgroundColor: colors.bg } }} />
  );
}
