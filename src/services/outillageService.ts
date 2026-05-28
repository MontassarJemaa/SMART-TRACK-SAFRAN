import { supabase } from './supabaseClient';
import { Outillage, RFIDTag, Site, SiteSelection, StatutScan } from '@/types';
import { normalizeEPC } from '@/utils/epcUtils';

type OutillageRow = {
  id?: string;
  code: string;
  designation: string;
  atelier: string;
  secteur: string;
  famille: string;
  projet: string;
  longueur_cm?: number | null;
  largeur_cm?: number | null;
  hauteur_cm?: number | null;
  materiau?: string | null;
  poids_kg?: number | null;
  epc?: string | null;
  localisation_actuelle?: string | null;
  statut?: string | null;
  classe?: string | null;
  date_service?: string | null;
  'date de service'?: string | null;
};

function rowToOutillage(row: OutillageRow): Outillage {
  return {
    id: row.id,
    atelier: row.atelier as Outillage['atelier'],
    code: row.code,
    designation: row.designation,
    epc: row.epc ?? undefined,
    famille: row.famille as Outillage['famille'],
    hauteur_cm: row.hauteur_cm ?? undefined,
    largeur_cm: row.largeur_cm ?? undefined,
    localisation_actuelle: (row.localisation_actuelle ?? row.secteur) as Site,
    longueur_cm: row.longueur_cm ?? undefined,
    materiau: (row.materiau ?? undefined) as Outillage['materiau'],
    poids_kg: row.poids_kg ?? undefined,
    projet: row.projet as Outillage['projet'],
    secteur: row.secteur as Outillage['secteur'],
    statut: (row.statut ?? 'non_trouve') as StatutScan,
    classe: row.classe ?? undefined,
    date_service: (row.date_service ?? row['date de service']) ?? undefined,
  };
}

function outillageToRow(outillage: Outillage): OutillageRow {
  return {
    atelier: outillage.atelier,
    code: outillage.code,
    designation: outillage.designation,
    epc: outillage.epc ? normalizeEPC(outillage.epc) : null,
    famille: outillage.famille,
    hauteur_cm: outillage.hauteur_cm ?? null,
    largeur_cm: outillage.largeur_cm ?? null,
    localisation_actuelle: outillage.localisation_actuelle ?? outillage.secteur,
    longueur_cm: outillage.longueur_cm ?? null,
    materiau: outillage.materiau ?? null,
    poids_kg: outillage.poids_kg ?? null,
    projet: outillage.projet,
    secteur: outillage.secteur,
    statut: outillage.statut ?? 'non_trouve',
    classe: outillage.classe ?? null,
    date_service: outillage.date_service ?? null,
    'date de service': outillage.date_service ?? null,
  };
}

export async function fetchOutillages(): Promise<Outillage[]> {
  const { data, error } = await supabase
    .from('outillages')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(rowToOutillage);
}

export async function upsertOutillages(outillages: Outillage[]): Promise<void> {
  const { error } = await supabase
    .from('outillages')
    .upsert(outillages.map(outillageToRow), { onConflict: 'code' });

  if (error) {
    throw error;
  }
}

export async function updateOutillageByEpc(
  epc: string,
  updates: Pick<Outillage, 'localisation_actuelle'> & Partial<Pick<Outillage, 'statut'>>
): Promise<void> {
  const { error } = await supabase
    .from('outillages')
    .update({
      localisation_actuelle: updates.localisation_actuelle,
      statut: updates.statut,
      updated_at: new Date().toISOString(),
    })
    .eq('epc', normalizeEPC(epc));

  if (error) {
    throw error;
  }
}

export async function recordScanHistory(
  tag: RFIDTag,
  site: SiteSelection,
  scannedBy = 'application',
  outillageId?: string
): Promise<void> {
  const { error } = await supabase.from('scan_history').insert({
    epc: normalizeEPC(tag.epc),
    outillage_id: outillageId ?? null,
    rssi: tag.rssi,
    scanned_by: scannedBy,
    site,
  });

  if (error) {
    throw error;
  }
}

export interface InventoryCampaignData {
  site: string;
  atelier?: string | null;
  status: 'en_cours' | 'complete' | 'annule';
  total_expected: number;
  total_found: number;
  total_missing: number;
  total_unexpected: number;
  completed_at?: string | null;
}

export interface CampaignDetailData {
  outillage_id?: string | null;
  epc: string;
  code?: string | null;
  designation?: string | null;
  status: 'present' | 'manquant' | 'inattendu';
  scanned_at?: string | null;
}

export async function createInventoryCampaign(
  campaign: InventoryCampaignData
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const { data, error } = await supabase
    .from('inventory_campaigns')
    .insert({
      site: campaign.site,
      atelier: campaign.atelier ?? null,
      status: campaign.status,
      total_expected: campaign.total_expected,
      total_found: campaign.total_found,
      total_missing: campaign.total_missing,
      total_unexpected: campaign.total_unexpected,
      created_by: user?.id ?? null,
      completed_at: campaign.completed_at ?? new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error('Failed to get campaign ID');
  }

  return data.id;
}

export async function addInventoryCampaignDetails(
  campaignId: string,
  details: CampaignDetailData[]
): Promise<void> {
  const { error } = await supabase
    .from('inventory_campaign_details')
    .insert(
      details.map((detail) => ({
        campaign_id: campaignId,
        outillage_id: detail.outillage_id ?? null,
        epc: detail.epc,
        code: detail.code ?? null,
        designation: detail.designation ?? null,
        status: detail.status,
        scanned_at: detail.scanned_at ?? null
      }))
    );

  if (error) {
    throw error;
  }
}
