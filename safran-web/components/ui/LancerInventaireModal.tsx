'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const SITES = ['CST 1', 'CST 2', 'T6', 'TTR'] as const;

type Step = 1 | 2;

interface LancerInventaireModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type ScopeOutillage = {
  id: string;
  statut?: string | null;
  epc?: string | null;
  code?: string | null;
  designation?: string | null;
};

type ScopeSummary = {
  total: number;
  enService: number;
  horsService: number;
  introuvables: number;
};

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function formatSupabaseError(error: unknown, context: string): string {
  const supabaseError = error as SupabaseLikeError;
  const message = supabaseError?.message ?? 'Erreur Supabase inconnue';
  const details = supabaseError?.details ? ` Détails: ${supabaseError.details}` : '';
  const hint = supabaseError?.hint ? ` Indice: ${supabaseError.hint}` : '';
  const code = supabaseError?.code ? ` (${supabaseError.code})` : '';
  return `${context}: ${message}${code}.${details}${hint}`;
}

function applyScope(query: any, site: string, projet: string, atelier: string, column = 'site') {
  let scoped = query.eq(column, site);
  if (projet) scoped = scoped.eq('projet', projet);
  if (atelier) scoped = scoped.eq('atelier', atelier);
  return scoped;
}

async function fetchScopeOptions(site: string, column: 'projet' | 'atelier'): Promise<string[]> {
  if (!isSupabaseConfigured || !site) {
    return [];
  }

  let response = await supabase
    .from('outillages')
    .select(column)
    .not(column, 'is', null)
    .eq('site', site)
    .order(column, { ascending: true });

  if (response.error) {
    response = await supabase
      .from('outillages')
      .select(column)
      .not(column, 'is', null)
      .eq('localisation_actuelle', site)
      .order(column, { ascending: true });
  }

  if (response.error) {
    throw response.error;
  }

  return [...new Set(((response.data ?? []) as Record<string, string>[]).map((row) => row[column]).filter(Boolean))];
}

async function countScope(site: string, projet: string, atelier: string): Promise<number> {
  if (!isSupabaseConfigured || !site) {
    return 0;
  }

  let query = supabase.from('outillages').select('id', { count: 'exact', head: true });
  let response = await applyScope(query, site, projet, atelier, 'site');

  if (response.error) {
    query = supabase.from('outillages').select('id', { count: 'exact', head: true });
    response = await applyScope(query, site, projet, atelier, 'localisation_actuelle');
  }

  if (response.error) {
    throw response.error;
  }

  return response.count ?? 0;
}

async function fetchScopeOutillages(site: string, projet: string, atelier: string): Promise<ScopeOutillage[]> {
  let query = supabase.from('outillages').select('id, statut, epc, code, designation');
  let response = await applyScope(query, site, projet, atelier, 'site');

  if (response.error) {
    query = supabase.from('outillages').select('id, statut, epc, code, designation');
    response = await applyScope(query, site, projet, atelier, 'localisation_actuelle');
  }

  if (response.error) {
    throw response.error;
  }

  return (response.data ?? []) as ScopeOutillage[];
}

export function LancerInventaireModal({ open, onClose, onSuccess }: LancerInventaireModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [selectedSite, setSelectedSite] = useState<string>('CST 1');
  const [projet, setProjet] = useState<string>('');
  const [atelier, setAtelier] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const projetsQuery = useQuery({
    queryKey: ['inventory-scope-projets', selectedSite],
    queryFn: () => fetchScopeOptions(selectedSite, 'projet'),
    enabled: open && Boolean(selectedSite)
  });
  const ateliersQuery = useQuery({
    queryKey: ['inventory-scope-ateliers', selectedSite],
    queryFn: () => fetchScopeOptions(selectedSite, 'atelier'),
    enabled: open && Boolean(selectedSite)
  });
  const countQuery = useQuery({
    queryKey: ['inventory-scope-count', selectedSite, projet, atelier],
    queryFn: () => countScope(selectedSite, projet, atelier),
    enabled: open && Boolean(selectedSite)
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedSite('CST 1');
      setProjet('');
      setAtelier('');
      setCampaignName('');
      setErrorMessage('');
    }
  }, [open]);

  useEffect(() => {
    setProjet('');
    setAtelier('');
  }, [selectedSite]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return;
      }

      const nombreOutillages = countQuery.data ?? 0;
      const { data: newCampagne, error: insertError } = await supabase
        .from('inventory_campaigns')
        .insert({
          site: selectedSite === 'Tous' ? 'Tous' : selectedSite,
          atelier: atelier || null,
          status: 'en_cours',
          total_expected: nombreOutillages,
          total_found: 0,
          total_missing: nombreOutillages,
          total_unexpected: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(formatSupabaseError(insertError, 'Création de la campagne impossible'));
      }

      const outillages = await fetchScopeOutillages(selectedSite, projet, atelier);
      
      if (outillages.length > 0) {
        const { error: detailsError } = await supabase.from('inventory_campaign_details').insert(
          outillages.map((outillage) => ({
            campaign_id: newCampagne.id,
            outillage_id: outillage.id,
            epc: outillage.epc,
            code: outillage.code,
            designation: outillage.designation,
            status: 'manquant'
          }))
        );

        if (detailsError) {
          console.error('Error inserting details:', detailsError);
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory_campaigns'] });
      onSuccess('Campagne d’inventaire lancée');
      onClose();
    },
    onError: (error) => {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de lancer la campagne.');
    }
  });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-safran-navy/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-safran-navy">Lancer un inventaire</h2>
            <p className="text-sm text-slate-500">Étape {step} sur 2</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Site
                <select
                  value={selectedSite}
                  onChange={(event) => setSelectedSite(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                >
                  {SITES.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Projet
                <select
                  value={projet}
                  onChange={(event) => setProjet(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                >
                  <option value="">Tous les projets</option>
                  {(projetsQuery.data ?? []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Atelier
                <select
                  value={atelier}
                  onChange={(event) => setAtelier(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                >
                  <option value="">Tous les ateliers</option>
                  {(ateliersQuery.data ?? []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <p className="rounded-2xl bg-safran-blue/10 px-4 py-3 text-sm font-semibold text-safran-navy">
                → {countQuery.isLoading ? '...' : countQuery.data ?? 0} outillages dans ce périmètre
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                <p>
                  <strong>Site :</strong> {selectedSite}
                </p>
                <p>
                  <strong>Projet :</strong> {projet || 'Tous'}
                </p>
                <p>
                  <strong>Atelier :</strong> {atelier || 'Tous'}
                </p>
                <p>
                  <strong>Nombre :</strong> {countQuery.data ?? 0} outillages
                </p>
              </div>
              <div className="rounded-2xl bg-safran-blue/10 p-4 text-sm text-safran-navy">
                <p className="font-bold">
                  Ce périmètre contient {countQuery.isLoading ? '...' : countQuery.data ?? 0} outillages
                </p>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Nom de la campagne
                <Input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder="Nom de la campagne (optionnel)"
                  className="mt-2"
                />
              </label>
            </div>
          )}

          {errorMessage ? (
            <p className="mt-4 text-sm font-semibold text-safran-danger">{errorMessage}</p>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            {step === 1 ? (
              <Button type="button" onClick={() => setStep(2)} disabled={!selectedSite || countQuery.isLoading}>
                Continuer
              </Button>
            ) : (
              <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lancement
                  </>
                ) : (
                  'Confirmer et lancer'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
