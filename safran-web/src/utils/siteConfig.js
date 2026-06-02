export const MAGASINS = ['T6', 'TTR']
export const SITES_PRODUCTION = ['CST 1', 'CST 2']

export const isMagasin = (localisation) => 
  MAGASINS.includes(localisation)

export const STATUTS_MAGASIN = [
  'En stock',
  'Perdu'
]

export const STATUTS_PRODUCTION = [
  'En production',
  'En étuvage',
  'En maintenance',
  'Perdu'
]

export const getStatutsByLocalisation = (localisation) =>
  isMagasin(localisation)
    ? STATUTS_MAGASIN
    : STATUTS_PRODUCTION

export const getStatutsBySite = getStatutsByLocalisation

export const normalizeLocalisation = (localisation) => 
  localisation === 'ALL' || localisation === 'Tous' ? 'Tous' : localisation
