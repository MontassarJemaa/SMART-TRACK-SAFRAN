import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafranCard } from '@/components/ui/SafranCard';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

export default function MenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="SAFRAN SMART TRACK" showSiteSelector />
      <View style={styles.container}>
        <SafranCard
          icon="+"
          label="Gérer les projets"
          onPress={() => router.push('/(main)/projets' as never)}
        />
        <SafranCard
          icon="🔍"
          label="Rechercher"
          onPress={() => router.push('/(main)/recherche' as never)}
        />
        <SafranCard
          icon="📦"
          label="Inventaire"
          onPress={() => router.push('/(main)/inventaire' as never)}
        />
        <SafranCard
          icon="📡"
          label="Scan Libre"
          onPress={() => router.push('/(main)/scan-libre' as never)}
        />
        <SafranCard
          icon="⚙️"
          label="Réglages"
          onPress={() => router.push('/(main)/reglages' as never)}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>SAFRAN SEATS TUNISIE</Text>
        <Text style={styles.footerDesigner}>Designed by Montassar Jemaa</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  footerDesigner: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
});
