import { useEffect, useMemo, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useRFID } from '@/hooks/useRFID';
import { useSafeBack } from '@/hooks/useSafeBack';
import { recordScanHistory, updateOutillageByEpc } from '@/services/outillageService';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateLocalisation } from '@/store/outillageSlice';
import { Outillage, RFIDTag, ScanEntry } from '@/types';
import { normalizeEPC } from '@/utils/epcUtils';
import { filterOutillagesBySite } from '@/utils/siteMapping';

interface ScanLibreEntry extends ScanEntry {
  id?: string;
  projet?: string;
  materiau?: string;
  poids_kg?: number;
  longueur_cm?: number;
  largeur_cm?: number;
  hauteur_cm?: number;
  belongsToCurrentSite: boolean;
}

function latestTags(tags: RFIDTag[]): RFIDTag[] {
  const byEpc = new Map<string, RFIDTag>();
  tags.forEach((tag) => {
    const current = byEpc.get(tag.epc);
    if (!current || tag.timestamp > current.timestamp) {
      byEpc.set(tag.epc, tag);
    }
  });
  return [...byEpc.values()];
}

function dimensions(entry: ScanLibreEntry): string {
  const longueur = entry.longueur_cm ?? '-';
  const largeur = entry.largeur_cm ?? '-';
  const hauteur = entry.hauteur_cm ?? '-';
  return `${longueur} × ${largeur} × ${hauteur} cm`;
}

function poids(entry: ScanLibreEntry): string {
  return entry.poids_kg === undefined ? 'Poids inconnu' : `${entry.poids_kg} kg`;
}

function buildEntry(tag: RFIDTag, known: Outillage | undefined, belongsToCurrentSite: boolean): ScanLibreEntry {
  return {
    atelier: known?.atelier,
    belongsToCurrentSite,
    code: known?.code,
    designation: known?.designation,
    epc: tag.epc,
    hauteur_cm: known?.hauteur_cm,
    id: known?.id,
    isKnown: Boolean(known),
    largeur_cm: known?.largeur_cm,
    lastSeen: new Date(tag.timestamp).toLocaleString(),
    localisation: known?.localisation_actuelle,
    longueur_cm: known?.longueur_cm,
    materiau: known?.materiau,
    poids_kg: known?.poids_kg,
    projet: known?.projet,
    rssi: tag.rssi,
  };
}

function ScanLibreCard({
  entry,
  onOpen,
}: {
  entry: ScanLibreEntry;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));

  function toggle() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    Animated.timing(animation, {
      duration: 180,
      toValue: nextExpanded ? 1 : 0,
      useNativeDriver: false,
    }).start();
    if (entry.isKnown) {
      onOpen();
    }
  }

  const detailsHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 92],
  });

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.entryCard,
        entry.isKnown && entry.belongsToCurrentSite && styles.currentSiteBorder,
        entry.isKnown && !entry.belongsToCurrentSite && styles.otherSiteBorder,
      ]}>
      <View style={styles.entryHeader}>
        <View style={styles.entryText}>
          <Text style={entry.isKnown ? styles.entryTitle : styles.unknownTitle}>
            {entry.isKnown ? entry.designation : 'Tag inconnu'}
          </Text>
          {entry.isKnown ? (
            <>
              <Text style={styles.entryMeta}>
                {entry.code} • {entry.projet}
              </Text>
              <Text style={styles.entryMeta}>
                {dimensions(entry)} • {poids(entry)}
              </Text>
            </>
          ) : null}
        </View>
        <View style={styles.entryAside}>
          <Text style={styles.rssi}>{entry.rssi} dBm</Text>
          {entry.localisation ? (
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>{entry.localisation}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Animated.View style={[styles.details, { height: detailsHeight }]}>
        <Text style={styles.monospace}>{entry.epc}</Text>
        {entry.isKnown ? (
          <Text style={styles.entryMeta}>
            {entry.atelier} • {entry.materiau ?? 'Matériau inconnu'} • {entry.localisation ?? 'Inconnue'}
          </Text>
        ) : null}
        <Text style={styles.entryMeta}>Dernière lecture : {entry.lastSeen}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ScanLibreScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const dispatch = useAppDispatch();
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const selectedPhysicalSite = currentSite === 'ALL' ? null : currentSite;
  const outillages = useAppSelector((state) => state.outillages.outillages);
  const { count, isScanning, resetScan, startScan, stopScan, tags } = useRFID();

  const entries = useMemo(
    () =>
      latestTags(tags).map((tag) => {
        const known = outillages.find(
          (outillage) => outillage.epc && normalizeEPC(outillage.epc) === normalizeEPC(tag.epc)
        );
        const belongsToCurrentSite = known ? filterOutillagesBySite([known], currentSite).length > 0 : false;
        return buildEntry(tag, known, belongsToCurrentSite);
      }),
    [currentSite, outillages, tags]
  );

  useEffect(() => {
    if (!selectedPhysicalSite) {
      return;
    }

    entries.forEach((entry) => {
      if (entry.isKnown && entry.localisation !== selectedPhysicalSite) {
        dispatch(updateLocalisation({ epc: entry.epc, site: selectedPhysicalSite }));
        updateOutillageByEpc(entry.epc, { localisation_actuelle: selectedPhysicalSite }).catch((error) =>
          console.error('Error updating Supabase outillage:', error)
        );
        recordScanHistory(
          {
            epc: entry.epc,
            id: entry.epc,
            locked: false,
            rssi: entry.rssi,
            timestamp: Date.now(),
            toolId: entry.id ?? entry.code ?? entry.epc,
          },
          selectedPhysicalSite,
          'scan-libre',
          entry.id
        ).catch((error) => console.error('Error recording Supabase scan history:', error));
      }
    });
  }, [dispatch, entries, selectedPhysicalSite]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Scan Libre" onMenuPress={safeBack} />
      <View style={styles.container}>
        <View style={styles.counterPanel}>
          <Text style={styles.counter}>{count}</Text>
          <Text style={styles.subtitle}>Tags détectés</Text>
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonThird}>
            <SafranButton label="DÉMARRER" onPress={() => startScan()} variant="success" disabled={isScanning} />
          </View>
          <View style={styles.buttonThird}>
            <SafranButton label="ARRÊTER" onPress={stopScan} variant="danger" disabled={!isScanning} />
          </View>
          <View style={styles.buttonThird}>
            <SafranButton label="RÉINITIALISER" onPress={resetScan} variant="outline" />
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={entries}
          keyExtractor={(item) => item.epc}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun tag détecté.</Text>}
          renderItem={({ item }) => (
            <ScanLibreCard
              entry={item}
              onOpen={() => {
                if (item.code) {
                  router.push({
                    pathname: '/(main)/detail-outillage',
                    params: { code: item.code },
                  } as never);
                }
              }}
            />
          )}
        />
        <SafranButton label="SÉLECTIONNER TOUT" onPress={() => undefined} variant="outline" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  buttonThird: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  counter: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.counter,
    fontWeight: '900',
    textAlign: 'center',
  },
  counterPanel: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  currentSiteBorder: {
    borderColor: COLORS.success,
  },
  details: {
    gap: SPACING.xs,
    overflow: 'hidden',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    padding: SPACING.lg,
    textAlign: 'center',
  },
  entryAside: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  entryCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  entryMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  entryText: {
    flex: 1,
    gap: SPACING.xs,
  },
  entryTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  listContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  locationBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  locationText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
  },
  monospace: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.sm,
  },
  otherSiteBorder: {
    borderColor: COLORS.warning,
  },
  rssi: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  subtitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  unknownTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontStyle: 'italic',
    fontWeight: '800',
  },
});
