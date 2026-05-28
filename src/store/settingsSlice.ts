import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Site, SiteSelection } from '@/types';

export const ALL_SITES_VALUE = 'ALL';
export const SITE_OPTIONS: Site[] = ['CST 1', 'CST 2', 'T6', 'TTR'];
export const USER_SITE_KEY = 'user_site';

export type RxSensitivity = 'Nominal' | 'High' | 'Low';
export type RfProfile = 'Nominal' | 'Dense Reader' | 'Dense Reader M4';
export const RX_SENSITIVITY_OPTIONS: RxSensitivity[] = ['Nominal', 'High', 'Low'];
export const RF_PROFILE_OPTIONS: RfProfile[] = ['Nominal', 'Dense Reader', 'Dense Reader M4'];

export interface SettingsState {
  username: string;
  currentSite: SiteSelection;
  rfidPower: number;
  rxSensitivity: RxSensitivity;
  rfProfile: RfProfile;
  locatePrecision: number;
}

const initialState: SettingsState = {
  username: '',
  currentSite: ALL_SITES_VALUE,
  rfidPower: 70,
  rxSensitivity: 'Nominal',
  rfProfile: 'Nominal',
  locatePrecision: 70,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setSite(state, action: PayloadAction<SiteSelection>) {
      state.currentSite = action.payload;
    },
    setRfidPower(state, action: PayloadAction<number>) {
      state.rfidPower = action.payload;
    },
    setRxSensitivity(state, action: PayloadAction<RxSensitivity>) {
      state.rxSensitivity = action.payload;
    },
    setRfProfile(state, action: PayloadAction<RfProfile>) {
      state.rfProfile = action.payload;
    },
    setLocatePrecision(state, action: PayloadAction<number>) {
      state.locatePrecision = action.payload;
    },
  },
});

export const {
  setLocatePrecision,
  setRfProfile,
  setRfidPower,
  setRxSensitivity,
  setSite,
  setUsername,
} = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
