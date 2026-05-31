import { format, parseISO } from 'date-fns';
import { Outillage, ScanHistory, SiteSelection } from '@/types';

export function formatSiteSelection(site: SiteSelection): string {
  return site === 'ALL' ? 'Tous les sites' : site;
}

export function formatDate(dateValue: string | undefined) {
  if (!dateValue) return '—';
  const date = parseISO(dateValue);
  return format(date, 'dd MMM yyyy HH:mm');
}

export type OutillageStatutAffichage = 'Disponible' | 'Emprunté' | 'En maintenance' | 'Perdu';

export function getStatusColor(status: OutillageStatutAffichage | undefined) {
  switch (status) {
    case 'Disponible':
      return 'bg-green-100 text-green-700';
    case 'Emprunté':
      return 'bg-sky-100 text-sky-700';
    case 'En maintenance':
      return 'bg-orange-100 text-orange-700';
    case 'Perdu':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function sortByDateDesc<T extends { scanned_at: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
}

export function formatRssi(rssi: number) {
  return `${rssi} dBm`;
}

export function getLatestScan(scans: ScanHistory[]) {
  return sortByDateDesc(scans)[0];
}
