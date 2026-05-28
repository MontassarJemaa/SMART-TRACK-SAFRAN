import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useRFID } from '@/hooks/useRFID';
import { useSafeBack } from '@/hooks/useSafeBack';
import { RFIDTag } from '@/types';

function TagRow({ item, onEdit }: { item: RFIDTag; onEdit: () => void }) {
  return (
    <View style={styles.tagRow}>
      <View style={styles.tagTextGroup}>
        <Text style={styles.epc}>{item.epc}</Text>
        <Text style={styles.timestamp}>
          Dernière lecture {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.rssi}>{item.rssi} dBm</Text>
      <Pressable onPress={onEdit} style={styles.editAction}>
        <Text style={styles.editActionText}>Modifier</Text>
      </Pressable>
    </View>
  );
}

export default function ScannerScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const { count, isScanning, resetScan, startScan, stopScan, tags } = useRFID();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Scanner des outillages" onMenuPress={safeBack} isConnected />
      <View style={styles.container}>
        <View style={styles.counterPanel}>
          <Text style={styles.counter}>{count}</Text>
          <Text style={styles.counterLabel}>Articles trouvés</Text>
        </View>

        <View style={styles.actions}>
          <SafranButton
            label={isScanning ? 'ARRÊTER' : 'DÉMARRER'}
            onPress={isScanning ? stopScan : startScan}
            variant={isScanning ? 'danger' : 'success'}
          />
          <SafranButton label="SÉLECTIONNER TOUT" onPress={resetScan} variant="outline" />
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={tags}
          keyExtractor={(item) => item.epc}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun tag scanné.</Text>}
          renderItem={({ item }) => (
            <TagRow
              item={item}
              onEdit={() =>
                router.push({
                  pathname: '/modifier-tag',
                  params: { epc: item.epc },
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
  actions: {
    gap: SPACING.sm,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  counter: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.counter,
    fontWeight: '900',
    textAlign: 'center',
  },
  counterLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  counterPanel: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
  },
  editAction: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  editActionText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.neutral,
    fontSize: FONT_SIZE.md,
    padding: SPACING.lg,
    textAlign: 'center',
  },
  epc: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  listContent: {
    gap: SPACING.sm,
    paddingTop: SPACING.lg,
  },
  rssi: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  tagRow: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  tagTextGroup: {
    flex: 1,
    gap: SPACING.xs,
    minWidth: 180,
  },
  timestamp: {
    color: COLORS.neutral,
    fontSize: FONT_SIZE.sm,
  },
});
