'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAtelierOptions, useProjetOptions } from '@/lib/outillage-hooks';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useDebounce } from '@/lib/useDebounce';
import { DEMO_OUTILLAGES } from '@/lib/demo-data';
import { isMagasin } from '@/src/utils/siteConfig';

const SITES = ['CST 1', 'CST 2', 'T6', 'TTR'] as const;

type Mode = 'unique' | 'projet';

type ModalOutillage = {
  id: string;
  code: string;
  designation: string;
  site: string;
  statut: string;
  projet?: string;
  atelier?: string;
};

interface NouveauTransfertModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function mapOutillageRow(row: Record<string, unknown>): ModalOutillage {
  return {
    id: String(row.id),
    code: String(row.code ?? ''),
    designation: String(row.designation ?? ''),
    site: String(row.site ?? row.localisation_actuelle ?? row.secteur ?? '—'),
    statut: String(row.statut ?? '—'),
    projet: row.projet ? String(row.projet) : undefined,
    atelier: row.atelier ? String(row.atelier) : undefined
  };
}

async function searchOutillages(term: string): Promise<ModalOutillage[]> {
  const cleanTerm = term.trim();
  if (cleanTerm.length < 2) {
    return [];
  }

  if (!isSupabaseConfigured) {
    return DEMO_OUTILLAGES.filter(
      (item) =>
        item.code.toLowerCase().includes(cleanTerm.toLowerCase()) ||
        item.designation.toLowerCase().includes(cleanTerm.toLowerCase())
    )
      .slice(0, 8)
      .map((item) => ({ ...item, site: item.site }));
  }

  const response = await supabase
    .from('outillages')
    .select('id, code, designation, site, localisation_actuelle, secteur, statut, projet, atelier')
    .or(`code.ilike.%${cleanTerm}%,designation.ilike.%${cleanTerm}%`)
    .limit(8);

  let data: unknown[] | null = response.data;
  let error = response.error;

  if (response.error) {
    const fallback = await supabase
      .from('outillages')
      .select('id, code, designation, localisation_actuelle, secteur, statut, projet, atelier')
      .or(`code.ilike.%${cleanTerm}%,designation.ilike.%${cleanTerm}%`)
      .limit(8);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapOutillageRow);
}

async function fetchProjectOutillages(projet: string): Promise<ModalOutillage[]> {
  if (!projet) {
    return [];
  }

  if (!isSupabaseConfigured) {
    return DEMO_OUTILLAGES.filter((item) => item.projet === projet).map((item) => ({ ...item, site: item.site }));
  }

  const response = await supabase
    .from('outillages')
    .select('id, code, designation, site, localisation_actuelle, secteur, statut, projet, atelier')
    .eq('projet', projet)
    .order('code', { ascending: true });

  let data: unknown[] | null = response.data;
  let error = response.error;

  if (response.error) {
    const fallback = await supabase
      .from('outillages')
      .select('id, code, designation, localisation_actuelle, secteur, statut, projet, atelier')
      .eq('projet', projet)
      .order('code', { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapOutillageRow);
}

async function insertMovement(
  outillage: ModalOutillage,
  values: {
    siteDestination: string;
    projetDestination: string;
    atelierDestination: string;
    motif: string;
    dateEffective: string;
  }
) {
  const statutArrivee = isMagasin(values.siteDestination) ? 'En stock' : 'En production';
  
  const insertResponse = await supabase.from('stock_movements').insert({
    outillage_id: outillage.id,
    code_outillage: outillage.code,
    site_depart: outillage.site,
    site_arrivee: values.siteDestination,
    statut_depart: outillage.statut,
    statut_arrivee: statutArrivee,
    modified_at: new Date().toISOString(),
    notes: values.motif || null
  });

  if (insertResponse.error) {
    throw insertResponse.error;
  }

  const updateResponse = await supabase
    .from('outillages')
    .update({
      localisation_actuelle: values.siteDestination,
      statut: statutArrivee,
      projet: values.projetDestination,
      atelier: isMagasin(values.siteDestination) ? null : values.atelierDestination
    })
    .eq('id', outillage.id);

  if (updateResponse.error) {
    throw updateResponse.error;
  }
}

export function NouveauTransfertModal({ open, onClose, onSuccess }: NouveauTransfertModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('unique');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedUnique, setSelectedUnique] = useState<ModalOutillage | null>(null);
  const [sourceProjet, setSourceProjet] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [siteDestination, setSiteDestination] = useState('CST 1');
  const [projetDestination, setProjetDestination] = useState('');
  const [atelierDestination, setAtelierDestination] = useState('');
  const [motif, setMotif] = useState('');
  const [dateEffective, setDateEffective] = useState(todayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const projetsQuery = useProjetOptions();
  const ateliersQuery = useAtelierOptions();
  const searchQuery = useQuery({
    queryKey: ['transfert-outillage-search', debouncedSearch],
    queryFn: () => searchOutillages(debouncedSearch),
    enabled: open && mode === 'unique' && debouncedSearch.trim().length >= 2
  });
  const projectOutillagesQuery = useQuery({
    queryKey: ['transfert-project-outillages', sourceProjet],
    queryFn: () => fetchProjectOutillages(sourceProjet),
    enabled: open && mode === 'projet' && Boolean(sourceProjet)
  });

  const projetOptions = projetsQuery.data ?? [];
  const atelierOptions = ateliersQuery.data ?? [];
  const projectOutillages = projectOutillagesQuery.data ?? [];

  const selectedProjectOutillages = useMemo(
    () => projectOutillages.filter((item) => selectedIds.includes(item.id)),
    [projectOutillages, selectedIds]
  );

  useEffect(() => {
    if (!projetDestination && projetOptions.length) {
      setProjetDestination(projetOptions[0]);
    }
  }, [projetDestination, projetOptions]);

  useEffect(() => {
    if (!atelierDestination && atelierOptions.length) {
      setAtelierDestination(atelierOptions[0]);
    }
  }, [atelierDestination, atelierOptions]);

  useEffect(() => {
    setSelectedIds([]);
  }, [sourceProjet]);

  useEffect(() => {
    if (!open) {
      setSelectedUnique(null);
      setSearchTerm('');
      setErrorMessage('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const selectedOutillages = mode === 'unique' ? (selectedUnique ? [selectedUnique] : []) : selectedProjectOutillages;
  const canSubmit = selectedOutillages.length > 0 && siteDestination && projetDestination && (isMagasin(siteDestination) || atelierDestination);

  async function handleSubmit() {
    setErrorMessage('');
    if (!canSubmit) {
      setErrorMessage('Sélectionnez au moins un outillage et complétez les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      } else {
        for (const outillage of selectedOutillages) {
          await insertMovement(outillage, {
            siteDestination,
            projetDestination,
            atelierDestination,
            motif,
            dateEffective
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['transferts'] });
      await queryClient.invalidateQueries({ queryKey: ['outillages'] });
      await queryClient.invalidateQueries({ queryKey: ['outillages-paginated'] });
      onSuccess('Transfert(s) enregistré(s) avec succès');
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erreur Supabase pendant l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleProjectSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAllProjectOutillages() {
    setSelectedIds((current) =>
      current.length === projectOutillages.length ? [] : projectOutillages.map((item) => item.id)
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-safran-navy/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-safran-navy">Nouveau transfert</h2>
            <p className="text-sm text-slate-500">Créer un mouvement d’outillage</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-74px)] overflow-y-auto p-6">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {[
              { key: 'unique' as const, label: 'Outillage unique' },
              { key: 'projet' as const, label: 'Par projet' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === tab.key ? 'bg-white text-safran-navy shadow-sm' : 'text-slate-600 hover:text-safran-navy'
                }`}
                disabled={isSubmitting}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'unique' ? (
            <div className="space-y-4">
              {!selectedUnique ? (
                <>
                  <label className="block text-sm font-semibold text-slate-700">
                    Recherche outillage
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Code ou désignation"
                        className="pl-9"
                        disabled={isSubmitting}
                      />
                    </div>
                  </label>
                  {searchQuery.isLoading ? (
                    <div className="rounded-2xl border border-slate-100 p-3 text-sm text-slate-500">Recherche...</div>
                  ) : searchQuery.data?.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                      {searchQuery.data.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedUnique(item)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-safran-blue/5"
                          disabled={isSubmitting}
                        >
                          <span>
                            <span className="block text-sm font-semibold text-safran-navy">{item.code}</span>
                            <span className="block text-xs text-slate-500">{item.designation}</span>
                          </span>
                          <Badge>{item.site}</Badge>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Carte de confirmation */}
                  <div className="rounded-2xl border-2 border-[#3b82f6] bg-[#eff6ff] p-4 transition-all duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#1a2744]">{selectedUnique.code}</span>
                            <Badge>{selectedUnique.site}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{selectedUnique.designation}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUnique(null)}
                        className="text-xs"
                        disabled={isSubmitting}
                      >
                        Changer
                        <X className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Formulaire direct sous la carte */}
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Site destination
                        <select
                          value={siteDestination}
                          onChange={(event) => setSiteDestination(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                          disabled={isSubmitting}
                        >
                          {SITES.map((site) => (
                            <option key={site} value={site}>
                              {site}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Projet destination
                        <select
                          value={projetDestination}
                          onChange={(event) => setProjetDestination(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                          disabled={isSubmitting}
                        >
                          <option value="">Sélectionner</option>
                          {projetOptions.map((projet) => (
                            <option key={projet} value={projet}>
                              {projet}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!isMagasin(siteDestination) ? (
                        <label className="block text-sm font-semibold text-slate-700">
                          Atelier destination
                          <select
                            value={atelierDestination}
                            onChange={(event) => setAtelierDestination(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                            disabled={isSubmitting}
                          >
                            <option value="">Sélectionner</option>
                            {atelierOptions.map((atelier) => (
                              <option key={atelier} value={atelier}>
                                {atelier}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      <label className="block text-sm font-semibold text-slate-700">
                        Date effective
                        <Input
                          type="date"
                          value={dateEffective}
                          onChange={(event) => setDateEffective(event.target.value)}
                          className="mt-2"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-semibold text-slate-700">
                      Motif
                      <textarea
                        value={motif}
                        onChange={(event) => setMotif(event.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                        placeholder="Optionnel"
                        disabled={isSubmitting}
                      />
                    </label>

                    {errorMessage ? <p className="mt-4 text-sm font-semibold text-safran-danger">{errorMessage}</p> : null}

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Annuler
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !selectedUnique || !siteDestination || !projetDestination || (!isMagasin(siteDestination) && !atelierDestination)}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirmer
                          </>
                        ) : (
                          'Confirmer'
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Projet source
                <select
                  value={sourceProjet}
                  onChange={(event) => setSourceProjet(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                  disabled={isSubmitting}
                >
                  <option value="">Sélectionner un projet</option>
                  {projetOptions.map((projet) => (
                    <option key={projet} value={projet}>
                      {projet}
                    </option>
                  ))}
                </select>
              </label>
              {sourceProjet ? (
                <div className="rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-semibold text-safran-navy">
                      {selectedIds.length} outillages sélectionnés
                    </span>
                    <Button type="button" variant="outline" onClick={toggleAllProjectOutillages} disabled={isSubmitting}>
                      {selectedIds.length === projectOutillages.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                    </Button>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-2">
                    {projectOutillagesQuery.isLoading ? (
                      <p className="p-3 text-sm text-slate-500">Chargement...</p>
                    ) : projectOutillages.length ? (
                      projectOutillages.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-safran-blue/5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleProjectSelection(item.id)}
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-slate-300 text-safran-blue focus:ring-safran-accent"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">{item.code}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {item.designation} · {item.site} · {item.statut}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="p-3 text-sm text-slate-500">Aucun outillage pour ce projet</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Keep form for "Par projet" mode */}
          {mode === 'projet' ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Site destination
                  <select
                    value={siteDestination}
                    onChange={(event) => setSiteDestination(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                    disabled={isSubmitting}
                  >
                    {SITES.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Projet destination
                  <select
                    value={projetDestination}
                    onChange={(event) => setProjetDestination(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner</option>
                    {projetOptions.map((projet) => (
                      <option key={projet} value={projet}>
                        {projet}
                      </option>
                    ))}
                  </select>
                </label>
                {!isMagasin(siteDestination) ? (
                  <label className="block text-sm font-semibold text-slate-700">
                    Atelier destination
                    <select
                      value={atelierDestination}
                      onChange={(event) => setAtelierDestination(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                      disabled={isSubmitting}
                    >
                      <option value="">Sélectionner</option>
                      {atelierOptions.map((atelier) => (
                        <option key={atelier} value={atelier}>
                          {atelier}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="block text-sm font-semibold text-slate-700">
                  Date effective
                  <Input
                    type="date"
                    value={dateEffective}
                    onChange={(event) => setDateEffective(event.target.value)}
                    className="mt-2"
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Motif
                <textarea
                  value={motif}
                  onChange={(event) => setMotif(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20"
                  placeholder="Optionnel"
                  disabled={isSubmitting}
                />
              </label>

              {errorMessage ? <p className="mt-4 text-sm font-semibold text-safran-danger">{errorMessage}</p> : null}

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmer
                    </>
                  ) : (
                    'Confirmer'
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
