export const STATUTS = [
  'en_stock',
  'en_production',
  'en_etuvage',
  'en_maintenance',
  'perdu'
] as const;

export type OutillageStatutCode = (typeof STATUTS)[number];

const LABELS: Record<string, string> = {
  en_stock: 'En stock',
  en_production: 'En production',
  en_etuvage: 'En étuvage',
  en_maintenance: 'En maintenance',
  perdu: 'Perdu',
  // rétrocompatibilité affichage
  disponible: 'En production',
  trouve: 'En production',
  emprunté: 'En étuvage',
  emprunte: 'En étuvage',
  'en maintenance': 'En maintenance',
  non_trouve: 'Perdu',
  'en stock': 'En stock'
};

const COLORS: Record<string, string> = {
  en_stock: 'bg-blue-100 text-blue-800',
  en_production: 'bg-blue-100 text-blue-800',
  en_etuvage: 'bg-orange-100 text-orange-800',
  en_maintenance: 'bg-yellow-100 text-yellow-800',
  perdu: 'bg-red-100 text-red-800',
  disponible: 'bg-blue-100 text-blue-800',
  trouve: 'bg-blue-100 text-blue-800',
  emprunté: 'bg-orange-100 text-orange-800',
  emprunte: 'bg-orange-100 text-orange-800',
  'en maintenance': 'bg-yellow-100 text-yellow-800',
  non_trouve: 'bg-red-100 text-red-800',
  'en stock': 'bg-blue-100 text-blue-800'
};

function normalizeStatutKey(statut: string): string {
  return statut.toLowerCase().trim().replace(/\s+/g, '_');
}

export function statutLabel(statut: string): string {
  const code = normalizeToStatutCode(statut);
  if (typeof code === 'string' && LABELS[code]) {
    return LABELS[code];
  }
  const key = normalizeStatutKey(statut);
  return LABELS[key] ?? LABELS[statut.toLowerCase()] ?? statut;
}

export function statutColor(statut: string): string {
  const code = normalizeToStatutCode(statut);
  if (typeof code === 'string' && COLORS[code]) {
    return COLORS[code];
  }
  const key = normalizeStatutKey(statut);
  return COLORS[key] ?? COLORS[statut.toLowerCase()] ?? 'bg-slate-100 text-slate-800';
}

export function normalizeToStatutCode(statut: string | null | undefined): OutillageStatutCode | string {
  const key = normalizeStatutKey(statut ?? '');
  if (STATUTS.includes(key as OutillageStatutCode)) {
    return key as OutillageStatutCode;
  }
  if (key === 'trouve' || key === 'disponible') return 'en_production';
  if (key === 'emprunte' || key === 'emprunté') return 'en_etuvage';
  if (key === 'non_trouve') return 'perdu';
  if (key === 'maintenance') return 'en_maintenance';
  if (key === 'stock') return 'en_stock';
  return key || 'en_production';
}

export interface StatutTransitionAction {
  target: OutillageStatutCode;
  label: string;
  confirm: string;
}

/** Actions de changement de statut à afficher (toutes sauf le statut actuel). */
export function availableStatutActions(
  currentStatut: string | null | undefined,
  localisation?: string | null
): StatutTransitionAction[] {
  const current = normalizeToStatutCode(currentStatut) as OutillageStatutCode;
  const isMagasin = localisation && ['T6', 'TTR'].includes(localisation);

  const allMagasin: StatutTransitionAction[] = [
    {
      target: 'en_stock',
      label: 'Mettre en stock',
      confirm: 'Mettre cet outillage en stock ?'
    },
    {
      target: 'perdu',
      label: 'Marquer comme perdu',
      confirm: 'Marquer cet outillage comme perdu ?'
    }
  ];

  const allProduction: StatutTransitionAction[] = [
    {
      target: 'en_production',
      label: 'Mettre en production',
      confirm: 'Remettre cet outillage en production ?'
    },
    {
      target: 'en_etuvage',
      label: 'Mettre en étuvage',
      confirm: 'Mettre cet outillage en étuvage ?'
    },
    {
      target: 'en_maintenance',
      label: 'Mettre en maintenance',
      confirm: 'Mettre cet outillage en maintenance ?'
    },
    {
      target: 'perdu',
      label: 'Marquer comme perdu',
      confirm: 'Marquer cet outillage comme perdu ?'
    }
  ];

  const all = isMagasin ? allMagasin : allProduction;

  return all.filter((action) => action.target !== current);
}
