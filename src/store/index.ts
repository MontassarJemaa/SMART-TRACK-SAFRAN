import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { outillageReducer } from './outillageSlice';
import { projectReducer } from './projectSlice';
import { rfidReducer } from './rfidSlice';
import { settingsReducer } from './settingsSlice';

export const store = configureStore({
  reducer: {
    outillages: outillageReducer,
    projects: projectReducer,
    rfid: rfidReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
