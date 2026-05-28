import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

export default function SplashScreen() {
  const router = useRouter();
  const { hasUsername, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      router.replace((hasUsername ? '/menu' : '/(auth)/username') as never);
    }, 2500);

    return () => clearTimeout(timer);
  }, [hasUsername, isLoading, router]);

  return (
    <View style={styles.container}>
      <Logo scale={3} />
      {isLoading && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loader: {
    marginTop: SPACING.xl,
    position: 'absolute',
    bottom: 80,
  },
});