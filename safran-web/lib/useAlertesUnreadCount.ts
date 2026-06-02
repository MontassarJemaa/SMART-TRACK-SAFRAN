'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

async function fetchUnreadAlertesCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { count, error } = await supabase
    .from('alertes')
    .select('id', { count: 'exact', head: true })
    .eq('lu', false);

  if (error) throw error;
  return count ?? 0;
}

export function useAlertesUnreadCount() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('alertes-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertes' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['alertes-unread-count'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['alertes-unread-count', isSupabaseConfigured],
    queryFn: fetchUnreadAlertesCount,
    refetchInterval: 30_000,
    retry: 1
  });
}
