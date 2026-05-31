import type { Site } from '@/types';

export type StatusBreakdownItem = { name: string; value: number };

export interface OutillagesStatsResult {
  total: number;
  presenceRate: number;
  alertsCount: number;
  statusBreakdown: StatusBreakdownItem[];
}

export type ScanPoint = { date: string; site: string; count: number };

export const DEMO_OUTILLAGES_STATS: OutillagesStatsResult = {
  total: 239,
  presenceRate: 94,
  alertsCount: 3,
  statusBreakdown: [
    { name: 'En production', value: 147 },
    { name: 'En étuvage', value: 58 },
    { name: 'En maintenance', value: 24 },
    { name: 'Perdu', value: 10 }
  ]
};

export const DEMO_SCANS_TODAY = 48;

export const DEMO_LAST_SCAN_HINT = 'Dernier scan il y a 4 min';

/** Génère ~30 jours de scans démo pour le graphique */
export function buildDemoScansByDay(days = 30): ScanPoint[] {
  const sites: Site[] = ['CST 1', 'CST 2', 'T6', 'TTR'];
  const points: ScanPoint[] = [];
  const now = new Date();

  for (let d = days - 1; d >= 0; d -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);
    sites.forEach((site, siteIndex) => {
      const base = 3 + siteIndex * 2 + Math.floor((days - d) / 5);
      points.push({
        date: dateStr,
        site,
        count: base + (d % 4)
      });
    });
  }

  return points;
}

export const DEMO_OUTILLAGES = [
  {
    id: 'demo-1',
    code: 'NH90-DR-001',
    designation: 'Plaque drapage NH90',
    site: 'CST 1' as Site,
    statut: 'en_production',
    projet: 'NH90',
    atelier: 'DRAPAGE'
  },
  {
    id: 'demo-2',
    code: 'NH90-US-014',
    designation: 'Fraise CN NH90',
    site: 'CST 2' as Site,
    statut: 'en_etuvage',
    projet: 'NH90',
    atelier: 'USINAGE'
  },
  {
    id: 'demo-3',
    code: 'H160-AS-203',
    designation: 'Gabarit assemblage H160',
    site: 'T6' as Site,
    statut: 'en_production',
    projet: 'H160 EFS',
    atelier: 'ASSEMBLAGE'
  },
  {
    id: 'demo-4',
    code: 'H160-CT-088',
    designation: 'Outillage contrôle H160',
    site: 'TTR' as Site,
    statut: 'en_maintenance',
    projet: 'H160 RAFT',
    atelier: 'ÉQUIPEMENT'
  },
  {
    id: 'demo-5',
    code: 'NH90-DR-045',
    designation: 'Template carbone NH90',
    site: 'CST 1' as Site,
    statut: 'perdu',
    projet: 'NH90',
    atelier: 'DRAPAGE'
  },
  {
    id: 'demo-6',
    code: 'H160-DR-112',
    designation: 'Outil drapage H160',
    site: 'CST 2' as Site,
    statut: 'en_production',
    projet: 'H160 EFS',
    atelier: 'DRAPAGE'
  },
  {
    id: 'demo-7',
    code: 'NH90-US-077',
    designation: 'Mandrin usinage NH90',
    site: 'T6' as Site,
    statut: 'en_etuvage',
    projet: 'NH90',
    atelier: 'USINAGE'
  },
  {
    id: 'demo-8',
    code: 'H160-AS-301',
    designation: 'Kit fixation H160',
    site: 'TTR' as Site,
    statut: 'en_production',
    projet: 'H160 RAFT',
    atelier: 'ASSEMBLAGE'
  }
];
