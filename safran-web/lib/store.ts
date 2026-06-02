import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SiteSelection } from '@/types';

interface DashboardState {
  siteFilter: SiteSelection;
}

const initialState: DashboardState = {
  siteFilter: 'ALL'
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSiteFilter(state, action: PayloadAction<SiteSelection>) {
      state.siteFilter = action.payload;
    }
  }
});

export const { setSiteFilter } = dashboardSlice.actions;

export const store = configureStore({
  reducer: {
    dashboard: dashboardSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
