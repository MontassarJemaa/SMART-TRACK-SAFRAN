import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'sb:session'
    }
  }
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type PageResult<T> = { data: T[] | null; error: unknown };

/**
 * Récupère toutes les lignes en paginant par blocs de `pageSize` (max Supabase 1000).
 * `builder` doit appliquer `.range(from, to)` sur la requête.
 */
export async function fetchAllPages<T>(
  builder: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await builder(from, to);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    all.push(...page);

    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return all;
}

export type { SupabaseClient };
