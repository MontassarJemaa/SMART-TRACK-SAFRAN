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

// Role utility functions
export type Role = 'admin' | 'maintenance' | 'superviseur' | 'magasin';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  maintenance: 'Maintenance',
  superviseur: 'Superviseur',
  magasin: 'Magasinier'
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-red-500 text-white',
  maintenance: 'bg-orange-500 text-white',
  superviseur: 'bg-blue-500 text-white',
  magasin: 'bg-green-500 text-white'
};

const ROLE_DOT_COLORS: Record<Role, string> = {
  admin: 'bg-red-500',
  maintenance: 'bg-orange-500',
  superviseur: 'bg-blue-500',
  magasin: 'bg-green-500'
};

export function getRoleLabel(role: Role | string): string {
  return ROLE_LABELS[role as Role] || role;
}

export function getRoleColor(role: Role | string): string {
  return ROLE_COLORS[role as Role] || 'bg-slate-500 text-white';
}

export function getRoleDotColor(role: Role | string): string {
  return ROLE_DOT_COLORS[role as Role] || 'bg-slate-500';
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? 'S';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}
