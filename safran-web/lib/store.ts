import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SiteSelection, Role } from '@/types';

interface DashboardState {
  siteFilter: SiteSelection;
}

const initialDashboardState: DashboardState = {
  siteFilter: 'ALL'
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: initialDashboardState,
  reducers: {
    setSiteFilter(state, action: PayloadAction<SiteSelection>) {
      state.siteFilter = action.payload;
    }
  }
});

interface AuthState {
  userId: string | null;
  email: string | null;
  role: Role;
  displayName: string | null;
  loading: boolean;
}

const initialAuthState: AuthState = {
  userId: null,
  email: null,
  role: 'superviseur', // Default fallback
  displayName: null,
  loading: true
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setAuthUser(state, action: PayloadAction<{
      userId: string;
      email: string;
      role: Role;
      displayName: string;
    }>) {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.displayName = action.payload.displayName;
      state.loading = false;
    },
    clearAuthUser(state) {
      state.userId = null;
      state.email = null;
      state.role = 'superviseur';
      state.displayName = null;
      state.loading = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    }
  }
});

export const { setSiteFilter } = dashboardSlice.actions;
export const { setAuthUser, clearAuthUser, setAuthLoading } = authSlice.actions;

export const store = configureStore({
  reducer: {
    dashboard: dashboardSlice.reducer,
    auth: authSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
