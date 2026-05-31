export type NiveauAlerte = 'critique' | 'avertissement' | 'information';

export type Alerte = {
  id: string;
  niveau: NiveauAlerte;
  message: string;
  site: string;
  date: string;
  outillageId?: string;
  type: 'perdu' | 'transfert_bloque' | 'maintenance' | 'etuvage' | 'info';
};

type OutillageAlerteRow = {
  id: string;
  code?: string | null;
  designation?: string | null;
  site?: string | null;
  localisation_actuelle?: string | null;
  secteur?: string | null;
  updated_at?: string | null;
  statut?: string | null;
};

type MouvementAlerteRow = {
  id: string;
  outillage_id?: string | null;
  site_origine?: string | null;
  site_destination?: string | null;
  site_depart?: string | null;
  site_arrivee?: string | null;
  created_at?: string | null;
  modified_at?: string | null;
  outillages?:
    | {
        code?: string | null;
        designation?: string | null;
      }
    | {
        code?: string | null;
        designation?: string | null;
      }[]
    | null;
};

export type AlertesSource = {
  perdus: OutillageAlerteRow[];
  transfertsBloques: MouvementAlerteRow[];
  maintenances: OutillageAlerteRow[];
  etuvages: OutillageAlerteRow[];
  transfertsValides: MouvementAlerteRow[];
  totalOutillages: number;
};

function rowSite(row: OutillageAlerteRow): string {
  return row.site ?? row.localisation_actuelle ?? row.secteur ?? '—';
}

function movementOutillage(row: MouvementAlerteRow) {
  return Array.isArray(row.outillages) ? row.outillages[0] : row.outillages;
}

function movementDate(row: MouvementAlerteRow): string {
  return row.created_at ?? row.modified_at ?? new Date().toISOString();
}

export function generateAlertes(source: AlertesSource): Alerte[] {
  const alertes: Alerte[] = [];

  source.perdus.forEach((row) => {
    alertes.push({
      id: `perdu-${row.id}`,
      niveau: 'critique',
      type: 'perdu',
      outillageId: row.id,
      message: `${row.code ?? '—'} — ${row.designation ?? '—'} déclaré perdu`,
      site: rowSite(row),
      date: row.updated_at ?? new Date().toISOString()
    });
  });

  source.transfertsBloques.forEach((row) => {
    const outillage = movementOutillage(row);
    const origine = row.site_origine ?? row.site_depart ?? '—';
    const destination = row.site_destination ?? row.site_arrivee ?? '—';
    alertes.push({
      id: `transfert-bloque-${row.id}`,
      niveau: 'critique',
      type: 'transfert_bloque',
      outillageId: row.outillage_id ?? undefined,
      message: `${outillage?.code ?? '—'} en transfert ${origine} → ${destination} depuis +48h — non confirmé`,
      site: destination,
      date: movementDate(row)
    });
  });

  source.maintenances.forEach((row) => {
    alertes.push({
      id: `maintenance-${row.id}`,
      niveau: 'avertissement',
      type: 'maintenance',
      outillageId: row.id,
      message: `${row.code ?? '—'} en maintenance depuis plus de 7 jours`,
      site: rowSite(row),
      date: row.updated_at ?? new Date().toISOString()
    });
  });

  source.etuvages.forEach((row) => {
    alertes.push({
      id: `etuvage-${row.id}`,
      niveau: 'avertissement',
      type: 'etuvage',
      outillageId: row.id,
      message: `${row.code ?? '—'} en étuvage depuis plus de 24h — vérification requise`,
      site: rowSite(row),
      date: row.updated_at ?? new Date().toISOString()
    });
  });

  source.transfertsValides.forEach((row) => {
    const outillage = movementOutillage(row);
    const origine = row.site_origine ?? row.site_depart ?? '—';
    const destination = row.site_destination ?? row.site_arrivee ?? '—';
    alertes.push({
      id: `transfert-valide-${row.id}`,
      niveau: 'information',
      type: 'info',
      outillageId: row.outillage_id ?? undefined,
      message: `${outillage?.code ?? '—'} transféré de ${origine} vers ${destination}`,
      site: destination,
      date: movementDate(row)
    });
  });

  alertes.push({
    id: 'sync-supabase',
    niveau: 'information',
    type: 'info',
    message: `Données synchronisées — ${source.totalOutillages} outillages chargés`,
    site: 'Tous',
    date: new Date().toISOString()
  });

  return alertes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
