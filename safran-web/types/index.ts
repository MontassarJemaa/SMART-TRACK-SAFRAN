// Types centraux de l'application SAFRAN SMART TRACK.

export type Site = 'CST 1' | 'CST 2' | 'T6' | 'TTR';
export type SiteSelection = 'ALL' | Site;

export type Atelier =
  | 'DRAPAGE'
  | 'USINAGE'
  | 'ASSEMBLAGE'
  | 'ÉQUIPEMENT'
  | 'MAGASIN MP';

export type Famille =
  | 'OUTILLAGES DRAPAGE'
  | "OUTILLAGES D'USINAGE"
  | "OUTILLAGES D'ASSEMBLAGE & EQUIPEMENT"
  | 'OUTILLAGE DE CONTRÔLE';

export type Projet =
  | 'NH90' | 'H160 EFS' | 'H160 RAFT' | 'JAL' | 'JAL2'
  | 'VUE' | 'VERSA' | 'PAS782' | 'DECO COVER'
  | '2S09' | '2S12' | '3S01' | '3S02' | '5C03';

export type Materiau = 'Aluminium' | 'Carbone' | 'LAB';
export type Secteur = 'CST 1' | 'CST 2';
/** Statuts opérationnels web (référentiel outillages) */
export type OutillageStatutOperatif =
  | 'en_production'
  | 'en_etuvage'
  | 'en_maintenance'
  | 'perdu';

/** Statuts scan inventaire mobile */
export type StatutScan = 'trouve' | 'non_trouve' | 'inattendu';
export type OutillageStatut = OutillageStatutOperatif | StatutScan | string;
export type Classe = 'A' | 'B' | 'C' | 'D' | 'E' | string;

export interface Outillage {
  id?: string;
  code: string;
  designation: string;
  atelier: Atelier;
  secteur: Secteur;
  famille: Famille;
  projet: Projet;
  longueur_cm?: number;
  largeur_cm?: number;
  hauteur_cm?: number;
  materiau?: Materiau;
  poids_kg?: number;
  epc?: string;
  localisation_actuelle?: Site;
  statut?: StatutScan;
  classe?: Classe;
  date_service?: string; // ISO date string (YYYY-MM-DD)
}

export interface Alerte {
  id: string;
  type: 'critique' | 'avertissement' | 'information';
  titre: string;
  description: string | null;
  site: string | null;
  outillage_id: string | null;
  lu: boolean;
  lu_at: string | null;
  created_at: string;
  email_sent: boolean | null;
  notified_at: string | null;
}

export interface ScanEntry {
  epc: string;
  rssi: number;
  designation?: string;
  code?: string;
  atelier?: Atelier;
  localisation?: Site;
  lastSeen: string;
  isKnown: boolean;
}

export interface InventaireResult {
  presents: Outillage[];
  absents: Outillage[];
  inattendus: ScanEntry[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  tools: ToolItem[];
  totalTools: number;
  foundTools: number;
  notFoundTools: number;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'failed';
}

export interface ToolItem {
  id: string;
  epc: string;
  name: string;
  location?: string;
  status: 'found' | 'not_found' | 'searching';
  serialNumber?: string;
  projectId: string;
  createdAt: number;
  lastScannedAt?: number;
  expirationDate?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface RFIDTag {
  id: string;
  epc: string;
  toolId: string;
  rssi: number;
  timestamp: number;
  locked: boolean;
}

export interface ScanHistory {
  id: string;
  outillage_id?: string;
  epc: string;
  rssi: number;
  scanned_by: string;
  site: SiteSelection;
  scanned_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastLogin: number;
  preferences: UserPreferences;
  isAnonymous: boolean;
}

export interface UserPreferences {
  rfidPower: number;
  rfidSensitivity: number;
  rfProfile: 'GEN2_US' | 'GEN2_EU' | 'GEN2_CHINA';
  precisionPercentage: number;
  language: 'fr' | 'en';
  darkMode: boolean;
  theme: 'blue' | 'dark';
}

export interface RFIDSettings {
  power: number;
  sensitivity: number;
  profile: 'GEN2_US' | 'GEN2_EU' | 'GEN2_CHINA';
  precision: number;
}

export interface CSVRow {
  [key: string]: string | number;
}

export interface ImportResult {
  success: boolean;
  projectId?: string;
  toolsImported: number;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface LocatingSession {
  id: string;
  projectId: string;
  toolId: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  signalStrength: number;
  distance?: number;
  lastSeen?: number;
}
