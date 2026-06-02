'use client';

import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

async function fetchPerduCount(): Promise<number> {
  if (!isSupabaseConfigured) {
    return 3;
  }

  const { count: perduCount, error: perduError } = await supabase
    .from('outillages')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'perdu');

  if (perduError) {
    throw perduError;
  }

  const olderThan48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  let blockedCount = 0;

  const blockedResponse = await supabase
    .from('stock_movements')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'en_cours')
    .lt('created_at', olderThan48h);

  if (!blockedResponse.error) {
    blockedCount = blockedResponse.count ?? 0;
  } else {
    const fallback = await supabase
      .from('stock_movements')
      .select('id', { count: 'exact', head: true })
      .eq('statut_arrivee', 'en_cours')
      .lt('modified_at', olderThan48h);
    blockedCount = fallback.error ? 0 : fallback.count ?? 0;
  }

  return (perduCount ?? 0) + blockedCount;
}

export function usePerduAlertCount() {
  return useQuery({
    queryKey: ['perdu-alert-count', isSupabaseConfigured],
    queryFn: fetchPerduCount,
    refetchInterval: 30_000,
    retry: 1
  });
}
