'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/lib/store';
import { PreferencesProvider } from '@/lib/useSettings';
import { AuthInitializer } from '@/components/AuthInitializer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchInterval: 30000,
      retry: 1
    }
  }
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <Provider store={store}>
        <AuthInitializer />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    </PreferencesProvider>
  );
}
