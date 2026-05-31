'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchAllPages, isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  DEMO_LAST_SCAN_HINT,
  DEMO_OUTILLAGES,
  DEMO_SCANS_TODAY,
  buildDemoScansByDay,
  type OutillagesStatsResult,
  type ScanPoint,
  type StatusBreakdownItem
} from '@/lib/demo-data';
import type { SiteSelection } from '@/types';

export const OUTILLAGES_PAGE_SIZE_OPTIONS = [10, 100, 1000] as const;
export type OutillagesPageSize = (typeof OUTILLAGES_PAGE_SIZE_OPTIONS)[number];

const OUTILLAGES_PAGE_SIZE = 50;

const STATUS_EN_STOCK = 'En stock';
const STATUS_EN_PRODUCTION = 'En production';
const STATUS_EN_ETUVAGE = 'En étuvage';
const STATUS_EN_MAINTENANCE = 'En maintenance';
const STATUS_PERDU = 'Perdu';

const OUTILLAGE_SELECT =
  'id, code, designation, statut, localisation_actuelle, secteur, projet, atelier, photo_url, nb_cycles, cycle_max';

const OUTILLAGE_LIST_SELECT = `${OUTILLAGE_SELECT}, scan_history(scanned_at)`;

type OutillageRow = {
  id: string;
  code: string;
  designation: string;
  statut?: string | null;
  localisation_actuelle?: string | null;
  secteur?: string | null;
  projet?: string | null;
  atelier?: string | null;
  photo_url?: string | null;
  nb_cycles?: number | null;
  cycle_max?: number | null;
};

type ScanHistoryRow = {
  id?: string;
  scanned_at: string;
  site?: string | null;
};

type ScanHistoryAggregateRow = {
  scanned_at: string;
  site?: string | null;
};

type AtelierAggregateRow = {
  atelier?: string | null;
};

type LostOutillageRow = {
  code: string;
  designation: string;
  localisation_actuelle?: string | null;
  secteur?: string | null;
  site?: string | null;
  statut?: string | null;
};

type EtuvageOutillageRow = {
  code: string;
  designation: string;
  atelier?: string | null;
  localisation_actuelle?: string | null;
  secteur?: string | null;
  site?: string | null;
};

type StockMovementRow = {
  id: string;
  outillage_id?: string | null;
  code_outillage?: string | null;
  site_depart?: string | null;
  site_arrivee?: string | null;
  statut_depart?: string | null;
  statut_arrivee?: string | null;
  modified_by?: string | null;
  modified_at?: string | null;
  notes?: string | null;
  outillages?: {
    designation?: string | null;
  } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutillagesQuery = any;

function rowSite(row: Pick<OutillageRow, 'localisation_actuelle' | 'secteur'>): string {
  return (row.localisation_actuelle ?? row.secteur ?? '').trim();
}

/** La table `outillages` utilise `localisation_actuelle`, pas `site`. */
function applySiteFilter(query: OutillagesQuery, siteFilter: SiteSelection): OutillagesQuery {
  if (siteFilter === 'ALL') {
    return query;
  }

  return query.eq('localisation_actuelle', siteFilter);
}

function statutValuesForFilter(statut: string): string[] | null {
  if (statut === 'tous') {
    return null;
  }

  const key = statut.toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, string[]> = {
    en_stock: [STATUS_EN_STOCK],
    en_production: [STATUS_EN_PRODUCTION],
    en_etuvage: [STATUS_EN_ETUVAGE],
    en_maintenance: [STATUS_EN_MAINTENANCE],
    perdu: [STATUS_PERDU]
  };

  return map[key] ?? [statut];
}

function applySearchFilter(query: OutillagesQuery, term: string): OutillagesQuery {
  if (!term) {
    return query;
  }

  return query.or(
    `code.ilike.%${term}%,designation.ilike.%${term}%,projet.ilike.%${term}%,atelier.ilike.%${term}%,localisation_actuelle.ilike.%${term}%`
  );
}

function applyProjetFilter(query: OutillagesQuery, projet: string): OutillagesQuery {
  if (!projet || projet === 'tous') {
    return query;
  }
  return query.eq('projet', projet);
}

function applyAtelierFilter(query: OutillagesQuery, atelier: string): OutillagesQuery {
  if (!atelier || atelier === 'tous') {
    return query;
  }
  return query.eq('atelier', atelier);
}

function applyStatutFilter(query: OutillagesQuery, statut: string): OutillagesQuery {
  const values = statutValuesForFilter(statut);
  if (!values) {
    return query;
  }

  if (values.length === 1) {
    return query.eq('statut', values[0]);
  }

  return query.in('statut', values);
}

async function countOutillages(
  siteFilter: SiteSelection,
  statutValues?: string[]
): Promise<number> {
  let query = supabase.from('outillages').select('id', { count: 'exact', head: true });
  query = applySiteFilter(query, siteFilter);

  if (statutValues && statutValues.length > 0) {
    query = query.in('statut', statutValues);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function countOutillagesByStatut(siteFilter: SiteSelection, statut: string): Promise<number> {
  let query = supabase.from('outillages').select('statut, localisation_actuelle, secteur');
  query = applySiteFilter(query, siteFilter);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as Pick<OutillageRow, 'statut' | 'localisation_actuelle' | 'secteur'>[]).filter(
    (row) => row.statut === statut
  ).length;
}

async function fetchOutillagesStats(siteFilter: SiteSelection): Promise<OutillagesStatsResult> {
  if (!isSupabaseConfigured) {
    return {
      total: 0,
      presenceRate: 0,
      alertsCount: 0,
      statusBreakdown: []
    };
  }

  try {
    const [total, enStockCount, disponibleCount, alertsCount] = await Promise.all([
      countOutillages(siteFilter),
      countOutillages(siteFilter, [STATUS_EN_STOCK, STATUS_EN_PRODUCTION]),
      countOutillages(siteFilter, [STATUS_EN_PRODUCTION]),
      countOutillages(siteFilter, [STATUS_PERDU])
    ]);

    if (total === 0) {
      return {
        total: 0,
        presenceRate: 0,
        alertsCount: 0,
        statusBreakdown: []
      };
    }

    const isMagasin = siteFilter === 'T6' || siteFilter === 'TTR';
    
    const statusBreakdown: StatusBreakdownItem[] = [];
    
    if (isMagasin) {
      const enStock = await countOutillagesByStatut(siteFilter, STATUS_EN_STOCK);
      if (enStock > 0) statusBreakdown.push({ name: STATUS_EN_STOCK, value: enStock });
      
      const perdu = await countOutillagesByStatut(siteFilter, STATUS_PERDU);
      if (perdu > 0) statusBreakdown.push({ name: STATUS_PERDU, value: perdu });
    } else {
      const enProduction = await countOutillagesByStatut(siteFilter, STATUS_EN_PRODUCTION);
      if (enProduction > 0) statusBreakdown.push({ name: STATUS_EN_PRODUCTION, value: enProduction });
      
      const enEtuvage = await countOutillagesByStatut(siteFilter, STATUS_EN_ETUVAGE);
      if (enEtuvage > 0) statusBreakdown.push({ name: STATUS_EN_ETUVAGE, value: enEtuvage });
      
      const enMaintenance = await countOutillagesByStatut(siteFilter, STATUS_EN_MAINTENANCE);
      if (enMaintenance > 0) statusBreakdown.push({ name: STATUS_EN_MAINTENANCE, value: enMaintenance });
      
      const perdu = await countOutillagesByStatut(siteFilter, STATUS_PERDU);
      if (perdu > 0) statusBreakdown.push({ name: STATUS_PERDU, value: perdu });
    }

    return {
      total,
      presenceRate: Math.round((enStockCount / total) * 100),
      alertsCount,
      statusBreakdown
    };
  } catch {
    return {
      total: 0,
      presenceRate: 0,
      alertsCount: 0,
      statusBreakdown: []
    };
  }
}

export interface ScansTodayResult {
  count: number;
  lastScanHint: string;
}

async function fetchScansToday(siteFilter: SiteSelection): Promise<ScansTodayResult> {
  if (!isSupabaseConfigured) {
    return { count: DEMO_SCANS_TODAY, lastScanHint: DEMO_LAST_SCAN_HINT };
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let countQuery = supabase
      .from('scan_history')
      .select('id', { count: 'exact', head: true })
      .gte('scanned_at', startOfDay.toISOString());

    if (siteFilter !== 'ALL') {
      countQuery = countQuery.eq('site', siteFilter);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    let lastQuery = supabase
      .from('scan_history')
      .select('scanned_at')
      .gte('scanned_at', startOfDay.toISOString())
      .order('scanned_at', { ascending: false })
      .limit(1);

    if (siteFilter !== 'ALL') {
      lastQuery = lastQuery.eq('site', siteFilter);
    }

    const { data: lastRows, error: lastError } = await lastQuery;

    if (lastError) {
      throw lastError;
    }

    const scanCount = count ?? 0;
    let lastScanHint = 'Aucun scan aujourd’hui';
    const lastScannedAt = (lastRows?.[0] as ScanHistoryRow | undefined)?.scanned_at;

    if (lastScannedAt) {
      const diffMin = Math.max(0, Math.round((Date.now() - new Date(lastScannedAt).getTime()) / 60000));
      lastScanHint =
        diffMin < 1 ? 'Dernier scan à l’instant' : `Dernier scan il y a ${diffMin} min`;
    }

    return { count: scanCount, lastScanHint };
  } catch {
    return { count: DEMO_SCANS_TODAY, lastScanHint: DEMO_LAST_SCAN_HINT };
  }
}

async function fetchScansByDay(days: number, siteFilter: SiteSelection): Promise<ScanPoint[]> {
  if (!isSupabaseConfigured) {
    return buildDemoScansByDay(days);
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const buildPage = (from: number, to: number) => {
      let query = supabase
        .from('scan_history')
        .select('scanned_at, site')
        .gte('scanned_at', since.toISOString())
        .order('scanned_at', { ascending: true })
        .range(from, to);

      if (siteFilter !== 'ALL') {
        query = query.eq('site', siteFilter);
      }

      return query;
    };

    const rows = await fetchAllPages<ScanHistoryAggregateRow>(
      (from, to) => buildPage(from, to),
      1000
    );

    const grouped = new Map<string, number>();

    rows.forEach((row) => {
      const site = (row.site ?? 'Inconnu').trim() || 'Inconnu';
      const date = row.scanned_at.slice(0, 10);
      const key = `${date}|${site}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return [...grouped.entries()].map(([key, scanCount]) => {
      const [date, site] = key.split('|');
      return { date, site, count: scanCount };
    });
  } catch {
    return buildDemoScansByDay(days);
  }
}

export interface AtelierDistributionItem {
  atelier: string;
  count: number;
}

async function fetchOutillagesByAtelier(siteFilter: SiteSelection): Promise<AtelierDistributionItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const rows = await fetchAllPages<AtelierAggregateRow>(
      (from, to) => {
        let query = supabase
          .from('outillages')
          .select('atelier', { count: 'exact' })
          .not('atelier', 'is', null)
          .range(from, to);
        query = applySiteFilter(query, siteFilter);
        return query;
      },
      1000
    );

    const grouped = new Map<string, number>();
    rows.forEach((row) => {
      const atelier = (row.atelier ?? '').trim();
      if (atelier) {
        grouped.set(atelier, (grouped.get(atelier) ?? 0) + 1);
      }
    });

    return [...grouped.entries()]
      .map(([atelier, count]) => ({ atelier, count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export interface RecentTransferItem {
  id: string;
  codeOutillage: string;
  siteDepart: string;
  siteArrivee: string;
  date: string | null;
  statut: string | null;
}

async function fetchRecentTransfers(): Promise<RecentTransferItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        outillages (
          designation
        )
      `)
      .order('modified_at', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    return ((data ?? []) as StockMovementRow[]).map((row) => ({
      id: row.id,
      codeOutillage: row.code_outillage ?? '—',
      siteDepart: row.site_depart ?? '—',
      siteArrivee: row.site_arrivee ?? '—',
      date: row.modified_at ?? null,
      statut: row.statut_arrivee ?? '—'
    }));
  } catch {
    return [];
  }
}

export interface LostOutillageItem {
  code: string;
  designation: string;
  site: string;
  statut: string;
}

async function fetchLostOutillages(siteFilter: SiteSelection): Promise<LostOutillageItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('outillages')
      .select('code, designation, localisation_actuelle, secteur, statut')
      .eq('statut', STATUS_PERDU)
      .order('updated_at', { ascending: false })
      .limit(5);
    query = applySiteFilter(query, siteFilter);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return ((data ?? []) as LostOutillageRow[]).map((row) => ({
      code: row.code,
      designation: row.designation,
      site: (row.site ?? rowSite(row)) || '—',
      statut: row.statut ?? STATUS_PERDU
    }));
  } catch {
    return [];
  }
}

export interface EtuvageOutillageItem {
  code: string;
  designation: string;
  atelier: string;
  site: string;
}

async function fetchEtuvageOutillages(siteFilter: SiteSelection): Promise<EtuvageOutillageItem[]> {
  if (siteFilter === 'T6' || siteFilter === 'TTR') {
    return [];
  }

  const allowedSites = siteFilter === 'ALL' ? ['CST 1', 'CST 2'] : [siteFilter];

  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('outillages')
      .select('code, designation, atelier, localisation_actuelle, secteur')
      .eq('statut', STATUS_EN_ETUVAGE)
      .in('localisation_actuelle', allowedSites)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as EtuvageOutillageRow[]).map((row) => ({
      code: row.code,
      designation: row.designation,
      atelier: row.atelier ?? '—',
      site: (row.site ?? rowSite(row)) || '—'
    }));
  } catch {
    return [];
  }
}

export interface OutillagesPaginatedFilters {
  search: string;
  statut: string;
  site: SiteSelection;
  projet: string;
  atelier: string;
}

export interface OutillageListItem {
  id: string;
  code: string;
  designation: string;
  site: string;
  statut: string;
  projet: string;
  atelier: string;
  photo_url?: string | null;
  lastScanAt?: string | null;
  nb_cycles?: number | null;
  cycle_max?: number | null;
}

export interface OutillagesPaginatedResult {
  items: OutillageListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type OutillageRowWithScans = OutillageRow & {
  scan_history?: { scanned_at: string }[];
};

function lastScanFromRow(row: OutillageRowWithScans): string | null {
  const scans = row.scan_history ?? [];
  if (!scans.length) {
    return null;
  }
  return [...scans].sort((a, b) => b.scanned_at.localeCompare(a.scanned_at))[0]?.scanned_at ?? null;
}

function mapOutillageRow(row: OutillageRowWithScans): OutillageListItem {
  const isMagasin = ['T6', 'TTR'].includes(row.localisation_actuelle ?? '');
  
  return {
    id: row.id,
    code: row.code,
    designation: row.designation,
    site: rowSite(row) || '—',
    statut: row.statut ?? 'en_production',
    projet: row.projet ?? '—',
    atelier: isMagasin ? '—' : (row.atelier ?? '—'),
    photo_url: row.photo_url ?? null,
    lastScanAt: lastScanFromRow(row),
    nb_cycles: row.nb_cycles,
    cycle_max: row.cycle_max
  };
}

function filterDemoOutillages(
  filters: OutillagesPaginatedFilters
): OutillageListItem[] {
  const term = filters.search.trim().toLowerCase();

  return DEMO_OUTILLAGES.filter((item) => {
    const matchesSearch =
      !term ||
      item.code.toLowerCase().includes(term) ||
      item.designation.toLowerCase().includes(term);
    const matchesStatut =
      filters.statut === 'tous' || item.statut.toLowerCase() === filters.statut.toLowerCase();
    const matchesSite = filters.site === 'ALL' || item.site === filters.site;
    const matchesProjet = filters.projet === 'tous' || item.projet === filters.projet;
    const matchesAtelier = filters.atelier === 'tous' || item.atelier === filters.atelier;
    return matchesSearch && matchesStatut && matchesSite && matchesProjet && matchesAtelier;
  }).map((item) => ({
    id: item.id,
    code: item.code,
    designation: item.designation,
    site: item.site,
    statut: item.statut,
    projet: item.projet,
    atelier: item.atelier
  }));
}

async function fetchOutillagesPaginated(
  page: number,
  pageSize: number,
  filters: OutillagesPaginatedFilters
): Promise<OutillagesPaginatedResult> {
  const safePage = Math.max(1, page);
  const safePageSize = pageSize > 0 ? pageSize : OUTILLAGES_PAGE_SIZE;

  if (!isSupabaseConfigured) {
    const all = filterDemoOutillages(filters).map((item) => ({
      ...item,
      lastScanAt: new Date(Date.now() - 3 * 86400000).toISOString()
    }));
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(safePage, totalPages);
    const from = (currentPage - 1) * safePageSize;
    const items = all.slice(from, from + safePageSize);

    return {
      items,
      total,
      page: currentPage,
      pageSize: safePageSize,
      totalPages
    };
  }

  try {
    let countQuery = supabase.from('outillages').select('id', { count: 'exact', head: true });
    countQuery = applySiteFilter(countQuery, filters.site);
    countQuery = applySearchFilter(countQuery, filters.search.trim());
    countQuery = applyStatutFilter(countQuery, filters.statut);
    countQuery = applyProjetFilter(countQuery, filters.projet);
    countQuery = applyAtelierFilter(countQuery, filters.atelier);

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(safePage, totalPages);
    const from = (currentPage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let dataQuery = supabase.from('outillages').select(OUTILLAGE_LIST_SELECT);
    dataQuery = applySiteFilter(dataQuery, filters.site);
    dataQuery = applySearchFilter(dataQuery, filters.search.trim());
    dataQuery = applyStatutFilter(dataQuery, filters.statut);
    dataQuery = applyProjetFilter(dataQuery, filters.projet);
    dataQuery = applyAtelierFilter(dataQuery, filters.atelier);
    dataQuery = dataQuery.order('code', { ascending: true }).range(from, to);

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      throw dataError;
    }

    return {
      items: ((data ?? []) as OutillageRowWithScans[]).map(mapOutillageRow),
      total,
      page: currentPage,
      pageSize: safePageSize,
      totalPages
    };
  } catch {
    const all = filterDemoOutillages(filters).map((item) => ({
      ...item,
      lastScanAt: null
    }));
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(safePage, totalPages);
    const sliceFrom = (currentPage - 1) * safePageSize;

    return {
      items: all.slice(sliceFrom, sliceFrom + safePageSize),
      total,
      page: currentPage,
      pageSize: safePageSize,
      totalPages
    };
  }
}

export interface InventaireOutillageItem extends OutillageListItem {}

async function fetchOutillagesBySite(site: SiteSelection): Promise<InventaireOutillageItem[]> {
  if (!isSupabaseConfigured || site === 'ALL') {
    return [];
  }

  try {
    const rows = await fetchAllPages<OutillageRow>(
      (from, to) =>
        supabase
          .from('outillages')
          .select(OUTILLAGE_SELECT)
          .eq('localisation_actuelle', site)
          .order('code', { ascending: true })
          .range(from, to),
      1000
    );

    return rows.map(mapOutillageRow);
  } catch {
    return DEMO_OUTILLAGES.filter((item) => item.site === site).map((item) => ({
      id: item.id,
      code: item.code,
      designation: item.designation,
      site: item.site,
      statut: item.statut,
      projet: item.projet,
      atelier: item.atelier
    }));
  }
}

export function useOutillagesStats(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-stats', siteFilter, isSupabaseConfigured],
    queryFn: () => fetchOutillagesStats(siteFilter),
    retry: 1
  });
}

export function useScansToday(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['scans-today', siteFilter, isSupabaseConfigured],
    queryFn: () => fetchScansToday(siteFilter),
    placeholderData: { count: DEMO_SCANS_TODAY, lastScanHint: DEMO_LAST_SCAN_HINT },
    retry: 1
  });
}

export function useScansByDay(days = 30, siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['scans-by-day', days, siteFilter, isSupabaseConfigured],
    queryFn: () => fetchScansByDay(days, siteFilter),
    placeholderData: buildDemoScansByDay(days),
    retry: 1
  });
}

export function useOutillagesEnStock(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-en-stock', siteFilter, isSupabaseConfigured],
    queryFn: () => (isSupabaseConfigured ? countOutillagesByStatut(siteFilter, STATUS_EN_STOCK) : 0),
    retry: 1
  });
}

export function useOutillagesEnProduction(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-en-production', siteFilter, isSupabaseConfigured],
    queryFn: () => (isSupabaseConfigured ? countOutillagesByStatut(siteFilter, STATUS_EN_PRODUCTION) : 0),
    retry: 1
  });
}

export function useOutillagesEnEtuvage(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-en-etuvage', siteFilter, isSupabaseConfigured],
    queryFn: () => (isSupabaseConfigured ? countOutillagesByStatut(siteFilter, STATUS_EN_ETUVAGE) : 0),
    retry: 1
  });
}

export function useOutillagesEnMaintenance(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-en-maintenance', siteFilter, isSupabaseConfigured],
    queryFn: () => (isSupabaseConfigured ? countOutillagesByStatut(siteFilter, STATUS_EN_MAINTENANCE) : 0),
    retry: 1
  });
}

export function useOutillagesPerdus(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-perdus', siteFilter, isSupabaseConfigured],
    queryFn: () => (isSupabaseConfigured ? countOutillagesByStatut(siteFilter, STATUS_PERDU) : 0),
    retry: 1
  });
}

export function useOutillagesAtelierDistribution(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['outillages-atelier-distribution', siteFilter, isSupabaseConfigured],
    queryFn: () => fetchOutillagesByAtelier(siteFilter),
    retry: 1
  });
}

export function useRecentTransfers() {
  return useQuery({
    queryKey: ['recent-transfers', isSupabaseConfigured],
    queryFn: fetchRecentTransfers,
    retry: 1
  });
}

export function useLostOutillages(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['lost-outillages', siteFilter, isSupabaseConfigured],
    queryFn: () => fetchLostOutillages(siteFilter),
    retry: 1
  });
}

export function useEtuvageOutillages(siteFilter: SiteSelection = 'ALL') {
  return useQuery({
    queryKey: ['etuvage-outillages', siteFilter, isSupabaseConfigured],
    queryFn: () => fetchEtuvageOutillages(siteFilter),
    retry: 1
  });
}

export function useOutillagesPaginated(
  page: number,
  pageSize: number,
  filters: OutillagesPaginatedFilters
) {
  return useQuery({
    queryKey: [
      'outillages',
      page,
      pageSize,
      filters.site,
      filters.statut,
      filters.search,
      filters.projet,
      filters.atelier,
      isSupabaseConfigured
    ],
    queryFn: () => fetchOutillagesPaginated(page, pageSize, filters),
    placeholderData: keepPreviousData,
    retry: 1
  });
}

export function useOutillagesBySite(site: SiteSelection) {
  return useQuery({
    queryKey: ['outillages-by-site', site, isSupabaseConfigured],
    queryFn: () => fetchOutillagesBySite(site),
    enabled: site !== 'ALL',
    retry: 1
  });
}
