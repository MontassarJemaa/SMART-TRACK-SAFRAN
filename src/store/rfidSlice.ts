import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RFIDTag } from '@/types';

export type ScanMode = 'free' | 'search' | 'locate';

export interface RFIDState {
  tags: RFIDTag[];
  isScanning: boolean;
  scanMode: ScanMode;
}

const initialState: RFIDState = {
  tags: [],
  isScanning: false,
  scanMode: 'free',
};

const rfidSlice = createSlice({
  name: 'rfid',
  initialState,
  reducers: {
    addTag(state, action: PayloadAction<RFIDTag>) {
      const index = state.tags.findIndex((tag) => tag.epc === action.payload.epc);

      if (index === -1) {
        state.tags.push(action.payload);
      } else {
        state.tags[index] = action.payload;
      }
    },
    clearTags(state) {
      state.tags = [];
    },
    setScanning(state, action: PayloadAction<boolean>) {
      state.isScanning = action.payload;
    },
    setScanMode(state, action: PayloadAction<ScanMode>) {
      state.scanMode = action.payload;
    },
  },
});

export const { addTag, clearTags, setScanning, setScanMode } = rfidSlice.actions;
export const rfidReducer = rfidSlice.reducer;
