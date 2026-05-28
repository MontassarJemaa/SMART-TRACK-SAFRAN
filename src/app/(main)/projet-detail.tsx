import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OutillageCard } from '@/components/ui/OutillageCard';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAppSelector } from '@/store';
import { Projet } from '@/types';
import { filterOutillagesBySite, formatSiteSelection } from '@/utils/siteMapping';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function ProjetDetailScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const params = useLocalSearchParams<{ projet?: string }>();
  const projet = firstParam(params.projet) as Projet;
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const allOutillages = useAppSelector((state) => state.outillages.outillages);
  const siteOutillages = filterOutillagesBySite(allOutillages, currentSite);
  const outillages = siteOutillages.filter((outillage) => outillage.projet === projet);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title={projet || 'Projet'} onMenuPress={safeBack} />
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          {outillages.length} outillages • {formatSiteSelection(currentSite)}
        </Text>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={outillages}
          keyExtractor={(item) => item.code}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun outillage pour ce projet.</Text>}
          renderItem={({ item }) => (
            <OutillageCard
              outillage={item}
              onPress={() =>
                router.push({
                  pathname: '/(main)/detail-outillage',
                  params: { code: item.code },
                } as never)
              }
            />
          )}
        />
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
