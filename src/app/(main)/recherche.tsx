import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutillageCard } from '@/components/ui/OutillageCard';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useRFID } from '@/hooks/useRFID';
import { useSafeBack } from '@/hooks/useSafeBack';
import { recordScanHistory, updateOutillageByEpc } from '@/services/outillageService';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  ATELIER_FILTERS,
  PROJET_FILTERS,
  filterByAtelier,
  filterByProjet,
  resetFilters,
  setSearchText,
  updateLocalisation,
  updateStatut,
} from '@/store/outillageSlice';
import { setScanMode } from '@/store/rfidSlice';
import { Outillage, RFIDTag, ScanEntry } from '@/types';
import { normalizeEPC } from '@/utils/epcUtils';
import { filterOutillagesBySite, formatSiteSelection, hasAteliers } from '@/utils/siteMapping';

type SectionItem = Outillage | ScanEntry;

interface SearchSection {
  title: string;
  subtitle: string;
  data: SectionItem[];
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim();
}

function isOutillage(item: SectionItem): item is Outillage {
  return 'designation' in item && 'projet' in item;
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
    <View style={styles.scanEntryCard}>
      <Text style={entry.isKnown ? styles.scanTitle : styles.unknownTitle}>
        {entry.isKnown ? entry.designation : 'Tag inconnu'}
      </Text>
      {entry.isKnown ? (
        <Text style={styles.scanMeta}>
          {entry.code} • {entry.atelier}
        </Text>
      ) : null}
      <Text style={styles.monospace}>{entry.epc}</Text>
      <Text style={styles.scanMeta}>
        {entry.rssi} dBm • Dernière lecture : {entry.lastSeen}
      </Text>
      {entry.localisation ? (
        <Text style={styles.scanMeta}>Dernière position : {entry.localisation}</Text>
      ) : null}
    </View>
  );
}

export default function RechercheScreen() {
  const safeBack = useSafeBack();
  const dispatch = useAppDispatch();
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const selectedPhysicalSite = currentSite === 'ALL' ? null : currentSite;
  const { filters, outillages } = useAppSelector((state) => state.outillages);
  const { isScanning, resetScan, startScan, stopScan, tags } = useRFID();
  const [isProjetModalVisible, setIsProjetModalVisible] = useState(false);
  const [isAtelierModalVisible, setIsAtelierModalVisible] = useState(false);
  const siteOutillages = useMemo(
    () => filterOutillagesBySite(outillages, currentSite),
    [currentSite, outillages]
  );
  const query = normalizeSearch(filters.searchText);

  const filteredOutillages = useMemo(
    () =>
      siteOutillages.filter((outillage) => {
        const matchesSearch =
          query.length === 0 ||
          normalizeSearch(`${outillage.code} ${outillage.designation}`).includes(query);
        const matchesProjet = filters.projet === null || outillage.projet === filters.projet;
        const matchesAtelier = filters.atelier === null || outillage.atelier === filters.atelier;
        return matchesSearch && matchesProjet && matchesAtelier;
      }),
    [filters.atelier, filters.projet, query, siteOutillages]
  );

  const filteredEpcs = useMemo(
    () =>
      new Set(
        filteredOutillages
          .map((outillage) => outillage.epc)
          .filter((epc): epc is string => Boolean(epc))
          .map(normalizeEPC)
      ),
    [filteredOutillages]
  );

  const horsFiltre = latestTags(tags)
    .filter((tag) => !filteredEpcs.has(normalizeEPC(tag.epc)))
    .map((tag) => {
      const known = outillages.find(
        (outillage) => outillage.epc && normalizeEPC(outillage.epc) === normalizeEPC(tag.epc)
      );
      return buildScanEntry(tag, known);
    });

  const foundCount = filteredOutillages.filter((outillage) => outillage.statut === 'trouve').length;
  const hasActiveFilter =
    filters.searchText.trim().length > 0 || filters.projet !== null || filters.atelier !== null;

  useEffect(() => {
    dispatch(setScanMode('search'));
    return () => {
      dispatch(setScanMode('free'));
    };
  }, [dispatch]);

  useEffect(() => {
    latestTags(tags).forEach((tag) => {
      const scannedEpc = normalizeEPC(tag.epc);
      const matched = filteredOutillages.find(
        (outillage) => outillage.epc && normalizeEPC(outillage.epc) === scannedEpc
      );
      const shouldUpdateLocation =
        selectedPhysicalSite !== null && matched?.localisation_actuelle !== selectedPhysicalSite;

      if (matched && (matched.statut !== 'trouve' || shouldUpdateLocation)) {
        dispatch(updateStatut({ epc: scannedEpc, statut: 'trouve' }));
        if (selectedPhysicalSite) {
          dispatch(updateLocalisation({ epc: scannedEpc, site: selectedPhysicalSite }));
          updateOutillageByEpc(scannedEpc, {
            localisation_actuelle: selectedPhysicalSite,
            statut: 'trouve',
          }).catch((error) => console.error('Error updating Supabase outillage:', error));
        }
        recordScanHistory(tag, currentSite, 'recherche', matched.id).catch((error) =>
          console.error('Error recording Supabase scan history:', error)
        );
      }
    });
  }, [currentSite, dispatch, filteredOutillages, selectedPhysicalSite, tags]);

  function handleSearch() {
    resetScan();
    startScan([...filteredEpcs]);
  }

  const sections: SearchSection[] = [
    {
      title: '🔵 DANS LE FILTRE',
      subtitle: filters.atelier ?? formatSiteSelection(currentSite),
      data: filteredOutillages,
    },
    {
      title: '⚠️ HORS FILTRE',
      subtitle: `${horsFiltre.length} tags détectés`,
      data: horsFiltre,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Rechercher des outillages" onMenuPress={safeBack} />
      <View style={styles.container}>
        <TextInput
          onChangeText={(value) => dispatch(setSearchText(value))}
          placeholder="Référence ou désignation..."
          placeholderTextColor={COLORS.neutral}
          style={styles.searchInput}
          value={filters.searchText}
        />

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Projet</Text>
          <Pressable
            onPress={() => setIsProjetModalVisible(true)}
            style={styles.dropdownButton}>
            <Text style={styles.dropdownButtonText}>
              {filters.projet ?? 'Tous les projets'} ▼
            </Text>
          </Pressable>
          {hasAteliers(currentSite) ? (
            <>
              <Text style={styles.filterLabel}>Process</Text>
              <Pressable
                onPress={() => setIsAtelierModalVisible(true)}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {filters.atelier ?? 'Tous les process'} ▼
                </Text>
              </Pressable>
            </>
          ) : null}
          {hasActiveFilter ? (
            <Pressable onPress={() => dispatch(resetFilters())} style={styles.resetChip}>
              <Text style={styles.resetText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setIsProjetModalVisible(false)}
          transparent
          visible={isProjetModalVisible}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsProjetModalVisible(false)}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  dispatch(filterByProjet(null));
                  setIsProjetModalVisible(false);
                }}
                style={styles.optionRow}>
                <Text style={[styles.optionText, filters.projet === null && styles.optionTextActive]}>
                  Tous les projets
                </Text>
                <Text style={styles.optionCheck}>{filters.projet === null ? '✓' : ''}</Text>
              </TouchableOpacity>
              {PROJET_FILTERS.map((projet) => (
                <TouchableOpacity
                  activeOpacity={0.75}
                  key={projet}
                  onPress={() => {
                    dispatch(filterByProjet(projet));
                    setIsProjetModalVisible(false);
                  }}
                  style={styles.optionRow}>
                  <Text style={[styles.optionText, filters.projet === projet && styles.optionTextActive]}>
                    {projet}
                  </Text>
                  <Text style={styles.optionCheck}>{filters.projet === projet ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => setIsAtelierModalVisible(false)}
          transparent
          visible={isAtelierModalVisible}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsAtelierModalVisible(false)}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  dispatch(filterByAtelier(null));
                  setIsAtelierModalVisible(false);
                }}
                style={styles.optionRow}>
                <Text style={[styles.optionText, filters.atelier === null && styles.optionTextActive]}>
                  Tous les process
                </Text>
                <Text style={styles.optionCheck}>{filters.atelier === null ? '✓' : ''}</Text>
              </TouchableOpacity>
              {ATELIER_FILTERS.map((atelier) => (
                <TouchableOpacity
                  activeOpacity={0.75}
                  key={atelier}
                  onPress={() => {
                    dispatch(filterByAtelier(atelier));
                    setIsAtelierModalVisible(false);
                  }}
                  style={styles.optionRow}>
                  <Text style={[styles.optionText, filters.atelier === atelier && styles.optionTextActive]}>
                    {atelier}
                  </Text>
                  <Text style={styles.optionCheck}>{filters.atelier === atelier ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <SafranButton label="RECHERCHER" onPress={handleSearch} variant="primary" disabled={isScanning} />
          </View>
          <View style={styles.buttonHalf}>
            <SafranButton label="ARRÊTER" onPress={stopScan} variant="danger" disabled={!isScanning} />
          </View>
        </View>

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {foundCount}/{filteredOutillages.length} outillages trouvés
          </Text>
        </View>

        <SectionList
          contentContainerStyle={styles.listContent}
          keyExtractor={(item, index) => (isOutillage(item) ? item.code : `${item.epc}-${index}`)}
          renderItem={({ item }) =>
            isOutillage(item) ? (
              <OutillageCard outillage={item} statut={item.statut ?? 'non_trouve'} />
            ) : (
              <ScanEntryCard entry={item} />
            )
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>({section.subtitle})</Text>
            </View>
          )}
          sections={sections}
          stickySectionHeadersEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonHalf: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  container: {
    flex: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    paddingVertical: SPACING.xs,
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  filterTextActive: {
    color: COLORS.textLight,
  },
  dropdownButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 150,
  },
  dropdownButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    elevation: 8,
    minWidth: 250,
    paddingVertical: SPACING.sm,
    shadowColor: COLORS.text,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: SPACING.md,
  },
  optionText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  optionCheck: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    width: 24,
  },
  listContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  monospace: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.sm,
  },
  resetChip: {
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  resetText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  scanEntryCard: {
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
  searchInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  statsBar: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statsText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  unknownTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontStyle: 'italic',
    fontWeight: '800',
  },
});
