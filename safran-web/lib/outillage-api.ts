import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { OutillageStatutOperatif } from '@/types';

export interface UpdateOutillagePayload {
  localisation_actuelle?: string;
  projet?: string;
  atelier?: string;
  statut?: OutillageStatutOperatif | string;
}

export async function updateOutillageById(id: string, payload: UpdateOutillagePayload) {
  if (!isSupabaseConfigured) {
    return;
  }

  const { error } = await supabase
    .from('outillages')
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export interface CreateTransfertPayload {
  outillageId: string;
  codeOutillage: string;
  siteDepart: string;
  siteArrivee: string;
  projet?: string;
  atelier?: string;
  motif: string;
  dateEffective: string;
  statutDepart?: string;
}

export async function createTransfert(payload: CreateTransfertPayload) {  if (!isSupabaseConfigured) {
    return;
  }

  const { error: movementError } = await supabase.from('stock_movements').insert({
    outillage_id: payload.outillageId,
    code_outillage: payload.codeOutillage,
    site_depart: payload.siteDepart,
    site_arrivee: payload.siteArrivee,
    statut_depart: payload.statutDepart ?? null,
    statut_arrivee: 'en_production',
    modified_at: payload.dateEffective,
    notes: payload.motif
  });

  if (movementError) {
    throw movementError;
  }

  const { error: updateError } = await supabase
    .from('outillages')
    .update({
      localisation_actuelle: payload.siteArrivee,
      projet: payload.projet ?? undefined,
      atelier: payload.atelier ?? undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', payload.outillageId);

  if (updateError) {
    throw updateError;
  }
}
