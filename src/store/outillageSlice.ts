import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Atelier, Famille, Outillage, Projet, Site, StatutScan } from '@/types';
import { normalizeEPC } from '@/utils/epcUtils';

export const ATELIER_FILTERS: Atelier[] = [
  'DRAPAGE',
  'USINAGE',
  'ASSEMBLAGE',
  'ÉQUIPEMENT',
];

export const PROJET_FILTERS: Projet[] = [
  'NH90',
  'H160 EFS',
  'H160 RAFT',
  'JAL',
  'JAL2',
  'VUE',
  'VERSA',
  'PAS782',
  'DECO COVER',
  '2S09',
  '2S12',
  '3S01',
  '3S02',
  '5C03',
];

export const FAMILLE_FILTERS: Famille[] = [
  'OUTILLAGES DRAPAGE',
  "OUTILLAGES D'USINAGE",
  "OUTILLAGES D'ASSEMBLAGE & EQUIPEMENT",
  'OUTILLAGE DE CONTRÔLE',
];

export interface OutillageFilters {
  atelier: Atelier | null;
  projet: Projet | null;
  famille: Famille | null;
  secteur: string | null;
  searchText: string;
}

export interface OutillageState {
  error: string | null;
  outillages: Outillage[];
  filtered: Outillage[];
  filters: OutillageFilters;
  isLoading: boolean;
  lastSyncedAt: number | null;
}

const emptyFilters: OutillageFilters = {
  atelier: null,
  projet: null,
  famille: null,
  secteur: null,
  searchText: '',
};

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim();
}

function hydrateOutillage(outillage: Outillage): Outillage {
  return {
    ...outillage,
    localisation_actuelle: outillage.localisation_actuelle ?? outillage.secteur,
    statut: outillage.statut ?? 'non_trouve',
  };
}

function applyFilters(outillages: Outillage[], filters: OutillageFilters): Outillage[] {
  const query = normalizeSearch(filters.searchText);

  return outillages.filter((outillage) => {
    const matchesAtelier = filters.atelier === null || outillage.atelier === filters.atelier;
    const matchesProjet = filters.projet === null || outillage.projet === filters.projet;
    const matchesFamille = filters.famille === null || outillage.famille === filters.famille;
    const matchesSecteur = filters.secteur === null || outillage.secteur === filters.secteur;
    const searchable = normalizeSearch(`${outillage.code} ${outillage.designation}`);
    const matchesSearch = query.length === 0 || searchable.includes(query);

    return matchesAtelier && matchesProjet && matchesFamille && matchesSecteur && matchesSearch;
  });
}

function updateOutillageByEpc(
  outillages: Outillage[],
  epc: string,
  update: (outillage: Outillage) => Outillage
): Outillage[] {
  const targetEpc = normalizeEPC(epc);
  return outillages.map((outillage) =>
    outillage.epc && normalizeEPC(outillage.epc) === targetEpc ? update(outillage) : outillage
  );
}

const initialState: OutillageState = {
  error: null,
  outillages: [],
  filtered: [],
  filters: emptyFilters,
  isLoading: false,
  lastSyncedAt: null,
};

const outillageSlice = createSlice({
  name: 'outillages',
  initialState,
  reducers: {
    setOutillages(state, action: PayloadAction<Outillage[]>) {
      state.outillages = action.payload.map(hydrateOutillage);
      state.filtered = applyFilters(state.outillages, state.filters);
      state.error = null;
      state.isLoading = false;
      state.lastSyncedAt = Date.now();
    },
    setOutillagesError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    setOutillagesLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setSearchText(state, action: PayloadAction<string>) {
      state.filters.searchText = action.payload;
      state.filtered = applyFilters(state.outillages, state.filters);
    },
    filterByAtelier(state, action: PayloadAction<Atelier | null>) {
      state.filters.atelier = action.payload;
      state.filtered = applyFilters(state.outillages, state.filters);
    },
    filterByProjet(state, action: PayloadAction<Projet | null>) {
      state.filters.projet = action.payload;
      state.filtered = applyFilters(state.outillages, state.filters);
    },
    filterByFamille(state, action: PayloadAction<Famille | null>) {
      state.filters.famille = action.payload;
      state.filtered = applyFilters(state.outillages, state.filters);
    },
    resetFilters(state) {
      state.filters = emptyFilters;
      state.filtered = applyFilters(state.outillages, state.filters);
    },
    updateStatut(state, action: PayloadAction<{ epc: string; statut: StatutScan }>) {
      state.outillages = updateOutillageByEpc(state.outillages, action.payload.epc, (outillage) => ({
        ...outillage,
        statut: action.payload.statut,
      }));
      state.filtered = applyFilters(state.outillages, state.filters);
    },
    updateLocalisation(state, action: PayloadAction<{ epc: string; site: Site }>) {
      state.outillages = updateOutillageByEpc(state.outillages, action.payload.epc, (outillage) => ({
        ...outillage,
        localisation_actuelle: action.payload.site,
      }));
      state.filtered = applyFilters(state.outillages, state.filters);
    },
  },
});

export const {
  filterByAtelier,
  filterByFamille,
  filterByProjet,
  resetFilters,
  setOutillages,
  setOutillagesError,
  setOutillagesLoading,
  setSearchText,
  updateLocalisation,
  updateStatut,
} = outillageSlice.actions;
export const outillageReducer = outillageSlice.reducer;
