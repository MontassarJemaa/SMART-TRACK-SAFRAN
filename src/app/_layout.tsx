import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import BackgroundLogo from '@/components/BackgroundLogo';
import { COLORS } from '@/constants/theme';
import { fetchOutillages } from '@/services/outillageService';
import { store, useAppDispatch } from '@/store';
import { setOutillages, setOutillagesError, setOutillagesLoading } from '@/store/outillageSlice';
import {
  RF_PROFILE_OPTIONS,
  RX_SENSITIVITY_OPTIONS,
  SITE_OPTIONS,
  ALL_SITES_VALUE,
  USER_SITE_KEY,
  RfProfile,
  RxSensitivity,
  setLocatePrecision,
  setRfProfile,
  setRfidPower,
  setRxSensitivity,
  setSite,
} from '@/store/settingsSlice';
import { Site, SiteSelection } from '@/types';

const RFID_POWER_KEY = 'rfid_power';
const RX_SENSITIVITY_KEY = 'rx_sensitivity';
const RF_PROFILE_KEY = 'rf_profile';
const LOCATE_PRECISION_KEY = 'locate_precision';

function isSiteSelection(value: string | null): value is SiteSelection {
  return value === ALL_SITES_VALUE || SITE_OPTIONS.includes(value as Site);
}

function isRxSensitivity(value: string | null): value is RxSensitivity {
  return RX_SENSITIVITY_OPTIONS.includes(value as RxSensitivity);
}

function isRfProfile(value: string | null): value is RfProfile {
  return RF_PROFILE_OPTIONS.includes(value as RfProfile);
}

function parseStoredNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function SettingsHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const [storedSite, storedPower, storedSensitivity, storedProfile, storedPrecision] =
        await Promise.all([
          AsyncStorage.getItem(USER_SITE_KEY),
          AsyncStorage.getItem(RFID_POWER_KEY),
          AsyncStorage.getItem(RX_SENSITIVITY_KEY),
          AsyncStorage.getItem(RF_PROFILE_KEY),
          AsyncStorage.getItem(LOCATE_PRECISION_KEY),
        ]);

      if (mounted && isSiteSelection(storedSite)) {
        dispatch(setSite(storedSite));
      }
      if (mounted && isRxSensitivity(storedSensitivity)) {
        dispatch(setRxSensitivity(storedSensitivity));
      }
      if (mounted && isRfProfile(storedProfile)) {
        dispatch(setRfProfile(storedProfile));
      }

      const power = parseStoredNumber(storedPower);
      const precision = parseStoredNumber(storedPrecision);
      if (mounted && power !== null) {
        dispatch(setRfidPower(power));
      }
      if (mounted && precision !== null) {
        dispatch(setLocatePrecision(precision));
      }
    }

    loadSettings().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return null;
}

function OutillagesHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    async function loadOutillages() {
      dispatch(setOutillagesLoading(true));

      try {
        const outillages = await fetchOutillages();
        if (mounted) {
          dispatch(setOutillages(outillages));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur Supabase inconnue';
        console.error('Error loading Supabase outillages:', error);
        if (mounted) {
          dispatch(setOutillagesError(message));
        }
      }
    }

    loadOutillages();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return null;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SettingsHydrator />
      <OutillagesHydrator />
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Stack 
          screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: 'transparent' } 
          }} 
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <BackgroundLogo />
        </View>
      </View>
    </Provider>
  );
}
