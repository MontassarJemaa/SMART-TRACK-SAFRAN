import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="menu" />
      <Stack.Screen name="projets" />
      <Stack.Screen name="projet-detail" />
      <Stack.Screen name="recherche" />
      <Stack.Screen name="inventaire" />
      <Stack.Screen name="scan-libre" />
      <Stack.Screen name="detail-outillage" />
      <Stack.Screen name="modifier-tag" />
      <Stack.Screen name="reglages" />
    </Stack>
  );
}
