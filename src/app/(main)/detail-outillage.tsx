import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAppSelector } from '@/store';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function DetailOutillageScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = firstParam(params.code);
  const outillage = useAppSelector((state) =>
    state.outillages.outillages.find((item) => item.code === code)
  );

  if (!outillage) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <SafranHeader title="Outillage" onMenuPress={safeBack} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Outillage introuvable</Text>
          <Text style={styles.secondaryText}>Code : {code || 'non fourni'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title={outillage.code} onMenuPress={safeBack} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.designation}>{outillage.designation}</Text>
          <Text style={styles.secondaryText}>
            {outillage.famille} • {outillage.projet}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localisation</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{outillage.atelier}</Text>
            <Text style={styles.value}>{outillage.secteur}</Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.label}>Dernière position</Text>
            {outillage.localisation_actuelle ? (
              <View style={styles.locationPill}>
                <Text style={styles.locationText}>{outillage.localisation_actuelle}</Text>
              </View>
            ) : (
              <Text style={styles.secondaryText}>Inconnue</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dimensions & Matériau</Text>
          <Text style={styles.value}>
            L: {outillage.longueur_cm ?? '-'}cm × l: {outillage.largeur_cm ?? '-'}cm × H:{' '}
            {outillage.hauteur_cm ?? '-'}cm
          </Text>
          <Text style={styles.value}>
            Matériau: {outillage.materiau ?? 'Non renseigné'} • Poids: {outillage.poids_kg ?? '-'} kg
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tag RFID</Text>
          {outillage.epc ? (
            <>
              <Text style={styles.label}>EPC</Text>
              <Text style={styles.monospace}>{outillage.epc}</Text>
              <SafranButton
                label="✏️ Modifier le tag"
                onPress={() =>
                  router.push({
                    pathname: '/(main)/modifier-tag',
                    params: { code: outillage.code },
                  } as never)
                }
                variant="warning"
              />
            </>
          ) : (
            <>
              <Text style={styles.secondaryText}>Aucun tag RFID associé</Text>
              <SafranButton
                label="Associer un tag"
                onPress={() =>
                  router.push({
                    pathname: '/(main)/modifier-tag',
                    params: { code: outillage.code },
                  } as never)
                }
                variant="primary"
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.md,
  },
  cardTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  designation: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  emptyState: {
    flex: 1,
    gap: SPACING.sm,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
  locationPill: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  locationText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
  monospace: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  secondaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  value: {
    color: COLORS.text,
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
