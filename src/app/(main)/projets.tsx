import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAppSelector } from '@/store';
import { Projet } from '@/types';
import { filterOutillagesBySite, formatSiteSelection } from '@/utils/siteMapping';

interface ProjectSummary {
  projet: Projet;
  count: number;
}

export default function ProjetsScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const allOutillages = useAppSelector((state) => state.outillages.outillages);
  const siteOutillages = filterOutillagesBySite(allOutillages, currentSite);
  const projects = siteOutillages.reduce<ProjectSummary[]>((accumulator, outillage) => {
    const existing = accumulator.find((item) => item.projet === outillage.projet);
    if (existing) {
      existing.count += 1;
      return accumulator;
    }

    return [...accumulator, { projet: outillage.projet, count: 1 }];
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Gérer les projets" onMenuPress={safeBack} />
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Site : {formatSiteSelection(currentSite)} • {siteOutillages.length} outillages
        </Text>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={projects}
          keyExtractor={(item) => item.projet}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun projet pour ce site.</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(main)/projet-detail',
                  params: { projet: item.projet },
                } as never)
              }
              style={styles.projectCard}>
              <View style={styles.projectText}>
                <Text style={styles.projectName}>{item.projet}</Text>
                <Text style={styles.projectCount}>{item.count} outillages</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  arrow: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  container: {
    flex: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    padding: SPACING.lg,
    textAlign: 'center',
  },
  listContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  projectCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  projectCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  projectName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  projectText: {
    flex: 1,
    gap: SPACING.xs,
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
