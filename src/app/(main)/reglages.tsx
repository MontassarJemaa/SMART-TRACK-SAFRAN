import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafranButton } from '@/components/ui/SafranButton';
import { SafranHeader } from '@/components/ui/SafranHeader';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  RfProfile,
  RxSensitivity,
  setLocatePrecision,
  setRfProfile,
  setRfidPower,
  setRxSensitivity,
} from '@/store/settingsSlice';

const SENSITIVITIES: RxSensitivity[] = ['Nominal', 'High', 'Low'];
const RF_PROFILES: RfProfile[] = ['Nominal', 'Dense Reader', 'Dense Reader M4'];
const RFID_POWER_KEY = 'rfid_power';
const RX_SENSITIVITY_KEY = 'rx_sensitivity';
const RF_PROFILE_KEY = 'rf_profile';
const LOCATE_PRECISION_KEY = 'locate_precision';

function ToggleGroup<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: T[];
  value: T;
}) {
  return (
    <View style={styles.toggleRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.toggle, value === option && styles.toggleActive]}>
          <Text style={[styles.toggleText, value === option && styles.toggleTextActive]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ReglagesScreen() {
  const safeBack = useSafeBack();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const { saveUsername } = useAuth();
  const [editingUser, setEditingUser] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(settings.username);

  async function persistNumber(key: string, value: number) {
    await AsyncStorage.setItem(key, String(value));
  }

  async function persistString(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  function changePower(delta: number) {
    const nextValue = Math.max(0, Math.min(100, settings.rfidPower + delta));
    dispatch(setRfidPower(nextValue));
    void persistNumber(RFID_POWER_KEY, nextValue);
  }

  function changeSensitivity(value: RxSensitivity) {
    dispatch(setRxSensitivity(value));
    void persistString(RX_SENSITIVITY_KEY, value);
  }

  function changeProfile(value: RfProfile) {
    dispatch(setRfProfile(value));
    void persistString(RF_PROFILE_KEY, value);
  }

  function changePrecision(delta: number) {
    const nextValue = Math.max(0, Math.min(100, settings.locatePrecision + delta));
    dispatch(setLocatePrecision(nextValue));
    void persistNumber(LOCATE_PRECISION_KEY, nextValue);
  }

  async function handleSaveUsername() {
    await saveUsername(usernameDraft);
    setEditingUser(false);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SafranHeader title="Réglages" onMenuPress={safeBack} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réglages RFID</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Puissance RFID</Text>
            <View style={styles.powerLabels}>
              <Text style={styles.secondaryText}>Low</Text>
              <Text style={styles.secondaryText}>High</Text>
            </View>
            <View style={styles.sliderRow}>
              <Pressable onPress={() => changePower(-10)} style={styles.sliderButton}>
                <Text style={styles.sliderButtonText}>−</Text>
              </Pressable>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${settings.rfidPower}%` }]} />
              </View>
              <Pressable onPress={() => changePower(10)} style={styles.sliderButton}>
                <Text style={styles.sliderButtonText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.valueText}>{settings.rfidPower}%</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sensibilité RX</Text>
            <ToggleGroup
              onChange={changeSensitivity}
              options={SENSITIVITIES}
              value={settings.rxSensitivity}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Profil RF</Text>
            <ToggleGroup onChange={changeProfile} options={RF_PROFILES} value={settings.rfProfile} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Précision de localisation</Text>
            <View style={styles.sliderRow}>
              <Pressable onPress={() => changePrecision(-5)} style={styles.sliderButton}>
                <Text style={styles.sliderButtonText}>−</Text>
              </Pressable>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${settings.locatePrecision}%` }]} />
              </View>
              <Pressable onPress={() => changePrecision(5)} style={styles.sliderButton}>
                <Text style={styles.sliderButtonText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.valueText}>{settings.locatePrecision}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateur</Text>
          {editingUser ? (
            <View style={styles.editUser}>
              <TextInput
                onChangeText={setUsernameDraft}
                placeholder="Nom utilisateur"
                placeholderTextColor={COLORS.neutral}
                style={styles.input}
                value={usernameDraft}
              />
              <SafranButton label="Enregistrer" onPress={handleSaveUsername} variant="primary" />
            </View>
          ) : (
            <View style={styles.userRow}>
              <Text style={styles.valueText}>{settings.username || 'Utilisateur non défini'}</Text>
              <Pressable
                onPress={() => {
                  setUsernameDraft(settings.username);
                  setEditingUser(true);
                }}
                style={styles.editButton}>
                <Text style={styles.editButtonText}>Modifier</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Licence</Text>
          <Text style={styles.valueText}>Device ID: SAFRAN-DEVICE</Text>
          <Text style={styles.activeText}>Appareil activé ✅</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.valueText}>Version: 1.0.0</Text>
          <Text style={styles.valueText}>Support technique Brady</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  editButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  editButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  editUser: {
    gap: SPACING.sm,
  },
  fieldGroup: {
    gap: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  powerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  secondaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  sliderButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sliderButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  sliderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggle: {
    backgroundColor: COLORS.neutralLight,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  toggleText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  toggleTextActive: {
    color: COLORS.textLight,
  },
  track: {
    backgroundColor: COLORS.neutralLight,
    borderRadius: RADIUS.full,
    flex: 1,
    height: 14,
    overflow: 'hidden',
  },
  trackFill: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    height: 14,
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  valueText: {
    color: COLORS.text,
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
