import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { RFIDSimulator } from '@/components/rfid/RFIDSimulator';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAppSelector } from '@/store';
import { normalizeEPC } from '@/utils/epcUtils';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ModifierTagScreen() {
  const safeBack = useSafeBack();
  const params = useLocalSearchParams<{ code?: string; epc?: string; name?: string }>();
  const code = firstParam(params.code);
  const outillage = useAppSelector((state) =>
    state.outillages.outillages.find((item) => item.code === code)
  );
  const initialEpc = useMemo(
    () => firstParam(params.epc) || outillage?.epc || RFIDSimulator.generateFakeEPC(),
    [outillage?.epc, params.epc]
  );
  const [name, setName] = useState(firstParam(params.name) ?? outillage?.designation ?? 'Nouveau tag');
  const [epc, setEpc] = useState(initialEpc);

  function handleWrite() {
    setEpc(normalizeEPC(epc));
    Alert.alert('ÉCRIRE', 'Écriture simulée avec succès.');
  }

  function handleLock() {
    Alert.alert('VERROUILLER', 'Verrouillage simulé avec succès.');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Modifier Tag RFID" onMenuPress={safeBack} />
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tag actuel</Text>
          <Text style={styles.currentEpc}>{initialEpc}</Text>
          {outillage ? <Text style={styles.outillageCode}>{outillage.code}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nom du tag</Text>
          <TextInput onChangeText={setName} style={styles.input} value={name} />
          <Text style={styles.label}>EPC</Text>
          <TextInput
            autoCapitalize="characters"
            onChangeText={setEpc}
            style={styles.input}
            value={epc}
          />
        </View>

        <SafranButton label="ÉCRIRE" onPress={handleWrite} variant="warning" />
        <SafranButton label="VERROUILLER" onPress={handleLock} variant="primary" />
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
  currentEpc: {
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    height: 52,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  outillageCode: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
});
