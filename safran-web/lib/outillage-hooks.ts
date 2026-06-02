'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllPages, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { DEMO_OUTILLAGES } from '@/lib/demo-data';
import { createTransfert, updateOutillageById, type CreateTransfertPayload } from '@/lib/outillage-api';
import type { OutillageStatutOperatif } from '@/types';

const OUTILLAGE_DETAIL_SELECT =
  'id, code, designation, statut, localisation_actuelle, secteur, projet, atelier, famille, epc, longueur_cm, largeur_cm, hauteur_cm, materiau, poids_kg, classe, date_service';

export interface OutillageDetail {
  id: string;
  code: string;
  designation: string;
  statut: string;
  site: string;
  projet: string;
  atelier: string;
  famille?: string;
  epc?: string;
  longueur_cm?: number;
  largeur_cm?: number;
  hauteur_cm?: number;
  materiau?: string;
  poids_kg?: number;
  classe?: string;
  date_service?: string;
  photo_url?: string | null;
  reference_fournisseur?: string | null;
  numero_serie?: string | null;
  magasin?: string | null;
  lastScanAt?: string | null;
}

export interface StockMovementRow {
  id: string;
  modified_at: string;
  site_depart: string | null;
  site_arrivee: string | null;
  notes: string | null;
  operateur: string;
}

type OutillageDetailRow = {
  id: string;
  code: string;
  designation: string;
  statut?: string | null;
  localisation_actuelle?: string | null;
  secteur?: string | null;
  projet?: string | null;
  atelier?: string | null;
  famille?: string | null;
  epc?: string | null;
  longueur_cm?: number | null;
  largeur_cm?: number | null;
  hauteur_cm?: number | null;
  materiau?: string | null;
  poids_kg?: number | null;
  classe?: string | null;
  date_service?: string | null;
  scan_history?: { scanned_at: string }[];
};

function mapDetail(row: OutillageDetailRow): OutillageDetail {
  const scans = row.scan_history ?? [];
  const lastScan =
    scans.length > 0
      ? [...scans].sort((a, b) => b.scanned_at.localeCompare(a.scanned_at))[0]?.scanned_at
      : null;

  return {
    id: row.id,
    code: row.code,
    designation: row.designation,
    statut: row.statut ?? 'en_production',
    site: row.localisation_actuelle ?? row.secteur ?? '—',
    projet: row.projet ?? '—',
    atelier: row.atelier ?? '—',
    famille: row.famille ?? undefined,
    epc: row.epc ?? undefined,
    longueur_cm: row.longueur_cm ?? undefined,
    largeur_cm: row.largeur_cm ?? undefined,
    hauteur_cm: row.hauteur_cm ?? undefined,
    materiau: row.materiau ?? undefined,
    poids_kg: row.poids_kg ?? undefined,
    classe: row.classe ?? undefined,
    date_service: row.date_service ?? undefined,
    lastScanAt: lastScan
  };
}

function demoDetail(id: string): OutillageDetail | null {
  const item = DEMO_OUTILLAGES.find((o) => o.id === id);
  if (!item) return null;
  return {
    id: item.id,
    code: item.code,
    designation: item.designation,
    statut: item.statut === 'disponible' ? 'en_production' : item.statut === 'emprunté' ? 'en_etuvage' : item.statut === 'en maintenance' ? 'en_maintenance' : item.statut,
    site: item.site,
    projet: item.projet,
    atelier: item.atelier,
    epc: 'E20034120189074000000001',
    longueur_cm: 120,
    largeur_cm: 80,
    hauteur_cm: 45,
    materiau: 'Carbone',
    poids_kg: 12.5,
    classe: 'A',
    date_service: '2022-06-15',
    reference_fournisseur: 'SAF-NH90-001',
    numero_serie: 'SN-2022-8841',
    lastScanAt: new Date(Date.now() - 3 * 86400000).toISOString()
  };
}

async function fetchOutillageDetail(id: string): Promise<OutillageDetail | null> {
  if (!isSupabaseConfigured) {
    return demoDetail(id);
  }

  const { data, error } = await supabase
    .from('outillages')
    .select(`${OUTILLAGE_DETAIL_SELECT}, scan_history(scanned_at)`)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapDetail(data as OutillageDetailRow);
}

const DEMO_MOVEMENTS: StockMovementRow[] = [
  {
    id: '1',
    modified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    site_depart: 'CST 1',
    site_arrivee: 'T6',
    notes: 'Transfert projet NH90',
    operateur: 'Montassar J.'
  },
  {
    id: '2',
    modified_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    site_depart: 'T6',
    site_arrivee: 'CST 2',
    notes: 'Retour atelier',
    operateur: 'Opérateur A'
  }
];

async function fetchStockMovements(outillageId: string): Promise<StockMovementRow[]> {
  if (!isSupabaseConfigured) {
    return DEMO_MOVEMENTS;
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, modified_at, site_depart, site_arrivee, notes, modified_by')
    .eq('outillage_id', outillageId)
    .order('modified_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    modified_at: row.modified_at as string,
    site_depart: row.site_depart as string | null,
    site_arrivee: row.site_arrivee as string | null,
    notes: row.notes as string | null,
    operateur: row.notes ? 'Opérateur' : 'Système'
  }));
}

async function fetchDistinctValues(column: 'projet' | 'atelier'): Promise<string[]> {
  if (!isSupabaseConfigured) {
    const key = column;
    return [...new Set(DEMO_OUTILLAGES.map((o) => o[key]).filter(Boolean))].sort();
  }

  const rows = await fetchAllPages<{ [k: string]: string }>(
    (from, to) =>
      supabase
        .from('outillages')
        .select(column)
        .not(column, 'is', null)
        .order(column, { ascending: true })
        .range(from, to),
    1000
  );

  return [...new Set(rows.map((r) => r[column]).filter(Boolean))].sort();
}

export function useProjetOptions() {
  return useQuery({
    queryKey: ['outillages-projets', isSupabaseConfigured],
    queryFn: () => fetchDistinctValues('projet'),
    staleTime: 60_000
  });
}

export function useAtelierOptions() {
  return useQuery({
    queryKey: ['outillages-ateliers', isSupabaseConfigured],
    queryFn: () => fetchDistinctValues('atelier'),
    staleTime: 60_000
  });
}

export function useOutillageDetail(id: string) {
  return useQuery({
    queryKey: ['outillage-detail', id, isSupabaseConfigured],
    queryFn: () => fetchOutillageDetail(id),
    enabled: Boolean(id)
  });
}

export function useStockMovements(outillageId: string) {
  return useQuery({
    queryKey: ['stock-movements', outillageId, isSupabaseConfigured],
    queryFn: () => fetchStockMovements(outillageId),
    enabled: Boolean(outillageId)
  });
}

export function useUpdateOutillageStatut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: OutillageStatutOperatif | string }) =>
      updateOutillageById(id, { statut }),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['outillages-paginated'] });
      void queryClient.invalidateQueries({ queryKey: ['outillage-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['outillages-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['perdu-alert-count'] });
    }
  });
}

export function useCreateTransfert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransfertPayload) => createTransfert(payload),
    onSuccess: (_, payload) => {
      void queryClient.invalidateQueries({ queryKey: ['outillages-paginated'] });
      void queryClient.invalidateQueries({ queryKey: ['outillage-detail', payload.outillageId] });
      void queryClient.invalidateQueries({ queryKey: ['stock-movements', payload.outillageId] });
    }
  });
}
