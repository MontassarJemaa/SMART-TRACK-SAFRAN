import { useCallback } from 'react';
import { useRouter } from 'expo-router';

export function useSafeBack(fallbackHref = '/menu') {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref as never);
  }, [fallbackHref, router]);
}
