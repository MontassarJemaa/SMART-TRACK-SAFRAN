import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutillageCard } from '@/components/ui/OutillageCard';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useRFID } from '@/hooks/useRFID';
import { useSafeBack } from '@/hooks/useSafeBack';
import { recordScanHistory, updateOutillageByEpc } from '@/services/outillageService';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateLocalisation } from '@/store/outillageSlice';
import { Atelier, Outillage, RFIDTag, ScanEntry } from '@/types';
import { normalizeEPC } from '@/utils/epcUtils';
import { filterOutillagesBySite, formatSiteSelection, getAteliersBySite, hasAteliers } from '@/utils/siteMapping';

type AccordionKey = 'presents' | 'absents' | 'inattendus';

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

function buildScanEntry(tag: RFIDTag, known?: Outillage): ScanEntry {
  return {
    atelier: known?.atelier,
    code: known?.code,
    designation: known?.designation,
    epc: tag.epc,
    isKnown: Boolean(known),
    lastSeen: new Date(tag.timestamp).toLocaleString(),
    localisation: known?.localisation_actuelle,
    rssi: tag.rssi,
  };
}

function ScanEntryCard({ entry }: { entry: ScanEntry }) {
  return (
    <View style={styles.scanEntry}>
      <Text style={entry.isKnown ? styles.scanTitle : styles.unknownTitle}>
        {entry.isKnown ? entry.designation : 'Tag inconnu'}
      </Text>
      {entry.isKnown ? (
        <Text style={styles.scanMeta}>
          {entry.code} • {entry.atelier}
        </Text>
      ) : null}
      <Text style={styles.monospace}>{entry.epc}</Text>
      <Text style={styles.scanMeta}>{entry.rssi} dBm • {entry.lastSeen}</Text>
    </View>
  );
}

function exportRows(rows: Outillage[], statut: string): string {
  return rows
    .map((outillage) =>
      [
        outillage.code,
        outillage.designation,
        outillage.atelier,
        outillage.projet,
        outillage.longueur_cm ?? '',
        outillage.largeur_cm ?? '',
        outillage.hauteur_cm ?? '',
        outillage.materiau ?? '',
        outillage.poids_kg ?? '',
        outillage.epc ?? '',
        statut,
      ].join(',')
    )
    .join('\n');
}

export default function InventaireScreen() {
  const safeBack = useSafeBack();
  const dispatch = useAppDispatch();
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const selectedPhysicalSite = currentSite === 'ALL' ? null : currentSite;
  const allOutillages = useAppSelector((state) => state.outillages.outillages);
  const { isScanning, resetScan, startScan, stopScan, tags } = useRFID();
  const [selectedAtelier, setSelectedAtelier] = useState<Atelier | null>(null);
  const [openSections, setOpenSections] = useState<Record<AccordionKey, boolean>>({
    absents: true,
    inattendus: true,
    presents: true,
  });
  const siteHasAteliers = hasAteliers(currentSite);
  const atelierOptions = getAteliersBySite(currentSite);
  const siteOutillages = useMemo(
    () => filterOutillagesBySite(allOutillages, currentSite),
    [allOutillages, currentSite]
  );
  const expected = useMemo(() => {
    if (siteHasAteliers) {
      return selectedAtelier ? siteOutillages.filter((outillage) => outillage.atelier === selectedAtelier) : [];
    }

    return siteOutillages;
  }, [selectedAtelier, siteHasAteliers, siteOutillages]);
  const expectedEpcs = new Set(
    expected
      .map((outillage) => outillage.epc)
      .filter((epc): epc is string => Boolean(epc))
      .map(normalizeEPC)
  );
  const detected = latestTags(tags);
  const detectedEpcs = new Set(detected.map((tag) => normalizeEPC(tag.epc)));
  const presents = expected.filter(
    (outillage) => outillage.epc && detectedEpcs.has(normalizeEPC(outillage.epc))
  );
  const absents = expected.filter(
    (outillage) => !outillage.epc || !detectedEpcs.has(normalizeEPC(outillage.epc))
  );
  const inattendus = detected
    .filter((tag) => !expectedEpcs.has(normalizeEPC(tag.epc)))
    .map((tag) => {
      const known = allOutillages.find(
        (outillage) => outillage.epc && normalizeEPC(outillage.epc) === normalizeEPC(tag.epc)
      );
      return buildScanEntry(tag, known);
    });

  useEffect(() => {
    if (!selectedPhysicalSite) {
      return;
    }

    presents.forEach((outillage) => {
      if (outillage.epc && outillage.localisation_actuelle !== selectedPhysicalSite) {
        dispatch(updateLocalisation({ epc: outillage.epc, site: selectedPhysicalSite }));
        updateOutillageByEpc(outillage.epc, { localisation_actuelle: selectedPhysicalSite, statut: 'trouve' }).catch(
          (error) => console.error('Error updating Supabase outillage:', error)
        );
        const tag = detected.find((item) => normalizeEPC(item.epc) === normalizeEPC(outillage.epc ?? ''));
        if (tag) {
          recordScanHistory(tag, selectedPhysicalSite, 'inventaire', outillage.id).catch((error) =>
            console.error('Error recording Supabase scan history:', error)
          );
        }
      }
    });
  }, [detected, dispatch, presents, selectedPhysicalSite]);

  function toggleSection(section: AccordionKey) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function handleStart() {
    resetScan();
    startScan([...expectedEpcs]);
  }

  function handleExport() {
    const csv = [
      'code,designation,atelier,projet,longueur_cm,largeur_cm,hauteur_cm,materiau,poids_kg,epc,statut',
      exportRows(presents, 'trouve'),
      exportRows(absents, 'non_trouve'),
    ]
      .filter(Boolean)
      .join('\n');
    Alert.alert('Export CSV', csv);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Inventaire" onMenuPress={safeBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {!isScanning ? (
          <View style={styles.panel}>
            {siteHasAteliers ? (
              <>
                <Text style={styles.sectionTitle}>Sélectionner un atelier</Text>
                <View style={styles.chipWrap}>
                  {atelierOptions.map((atelier) => (
                    <Pressable
                      key={atelier}
                      onPress={() => setSelectedAtelier(atelier)}
                      style={[styles.chip, selectedAtelier === atelier && styles.chipActive]}>
                      <Text style={[styles.chipText, selectedAtelier === atelier && styles.chipTextActive]}>
                        {atelier}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.sectionTitle}>
                {currentSite === 'ALL'
                  ? 'Inventaire complet de tous les sites'
                  : `Inventaire complet du magasin ${formatSiteSelection(currentSite)}`}
              </Text>
            )}
            <Text style={styles.expectedText}>{expected.length} outillages attendus</Text>
            <SafranButton
              disabled={siteHasAteliers && selectedAtelier === null}
              label="LANCER L'INVENTAIRE"
              onPress={handleStart}
              variant="primary"
            />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statPill, styles.presentPill]}>
                <Text style={styles.statText}>🟢 {presents.length} Présents</Text>
              </View>
              <View style={[styles.statPill, styles.missingPill]}>
                <Text style={styles.statText}>🔴 {absents.length} Manquants</Text>
              </View>
              <View style={[styles.statPill, styles.unexpectedPill]}>
                <Text style={styles.statText}>🟡 {inattendus.length} Inattendus</Text>
              </View>
            </View>
            <SafranButton label="ARRÊTER" onPress={stopScan} variant="danger" />

            <Pressable onPress={() => toggleSection('presents')} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>✅ PRÉSENTS ({presents.length})</Text>
            </Pressable>
            {openSections.presents ? presents.map((item) => (
              <OutillageCard key={item.code} outillage={item} statut="trouve" />
            )) : null}

            <Pressable onPress={() => toggleSection('absents')} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>❌ MANQUANTS ({absents.length})</Text>
            </Pressable>
            {openSections.absents ? absents.map((item) => (
              <OutillageCard key={item.code} outillage={item} statut="non_trouve" />
            )) : null}

            <Pressable onPress={() => toggleSection('inattendus')} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>⚠️ INATTENDUS ({inattendus.length})</Text>
            </Pressable>
            {openSections.inattendus ? inattendus.map((item) => (
              <ScanEntryCard key={item.epc} entry={item} />
            )) : null}

            <SafranButton label="📤 EXPORTER CSV" onPress={handleExport} variant="outline" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accordionHeader: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  accordionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  chipTextActive: {
    color: COLORS.textLight,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  expectedText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  missingPill: {
    backgroundColor: COLORS.dangerLight,
  },
  monospace: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.sm,
  },
  panel: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.md,
  },
  presentPill: {
    backgroundColor: COLORS.successLight,
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  scanEntry: {
    backgroundColor: COLORS.warningLight,
    borderColor: COLORS.warning,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  scanMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  scanTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  statPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  statText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  unexpectedPill: {
    backgroundColor: COLORS.warningLight,
  },
  unknownTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontStyle: 'italic',
    fontWeight: '800',
  },
});
