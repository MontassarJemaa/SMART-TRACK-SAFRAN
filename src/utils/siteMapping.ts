import { Site, SiteSelection, Atelier, Outillage } from '../types';

export const SITE_ATELIERS: Record<Site, Atelier[]> = {
  'CST 1': [
    'DRAPAGE',
    'USINAGE',
    'ASSEMBLAGE',
    'ÉQUIPEMENT',
    'MAGASIN MP',
  ],
  'CST 2': [
    'DRAPAGE',
    'USINAGE',
    'ASSEMBLAGE',
    'ÉQUIPEMENT',
  ],
  T6: [],
  TTR: [],
};

export const getAteliersBySite = (site: SiteSelection): Atelier[] =>
  site === 'ALL' ? [] : SITE_ATELIERS[site];

export const hasAteliers = (site: SiteSelection): boolean => getAteliersBySite(site).length > 0;

export const formatSiteSelection = (site: SiteSelection): string =>
  site === 'ALL' ? 'Tous les sites' : site;

export const filterOutillagesBySite = (
  outillages: Outillage[],
  site: SiteSelection
): Outillage[] => {
  if (site === 'ALL') {
    return outillages;
  }

  // Filtre direct par localisation physique de l'outillage
  return outillages.filter((outillage) => outillage.localisation_actuelle === site);
};
