'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useSafeBack(fallbackHref = '/dashboard') {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [router, fallbackHref]);
}
