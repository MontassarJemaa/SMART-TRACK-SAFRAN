'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAtelierOptions, useProjetOptions } from '@/lib/outillage-hooks';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Site } from '@/types';

const SITES: Site[] = ['CST 1', 'CST 2', 'T6', 'TTR'];

interface TransfertModalProps {
  outillageId: string;
  codeOutillage: string;
  siteDepart: string;
  projetActuel?: string | null;
  atelierActuel?: string | null;
  statutDepart?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransfertModal({
  outillageId,
  codeOutillage,
  siteDepart,
  projetActuel,
  atelierActuel,
  statutDepart,
  onClose,
  onSuccess
}: TransfertModalProps) {
  const queryClient = useQueryClient();
  const { data: projets = [] } = useProjetOptions();
  const { data: ateliers = [] } = useAtelierOptions();

  const [siteDestination, setSiteDestination] = useState<Site>('CST 1');
  const [projetDestination, setProjetDestination] = useState('');
  const [atelierDestination, setAtelierDestination] = useState('');
  const [motif, setMotif] = useState('');
  const [dateEffective, setDateEffective] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    console.log('Transfert: handler déclenché', {
      outillageId,
      siteDestination,
      projetDestination,
      atelierDestination,
      motif
    });

    if (!isSupabaseConfigured) {
      setFormError('Supabase non configuré.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const projetFinal = projetDestination || projetActuel || null;
    const atelierFinal = atelierDestination || atelierActuel || null;
    const motifFinal = motif.trim() || 'Transfert manuel';

    try {
      const { error: movementError } = await supabase.from('stock_movements').insert({
        outillage_id: outillageId,
        code_outillage: codeOutillage,
        site_depart: siteDepart,
        site_arrivee: siteDestination,
        statut_depart: statutDepart ?? null,
        statut_arrivee: statutDepart ?? null,
        modified_at: new Date(dateEffective).toISOString(),
        notes: motifFinal
      });

      if (movementError) {
        console.error('Transfert error:', movementError);
        setFormError(movementError.message || 'Erreur lors du transfert.');
        return;
      }

      const { error: updateError } = await supabase
        .from('outillages')
        .update({
          localisation_actuelle: siteDestination,
          projet: projetFinal,
          atelier: atelierFinal,
          updated_at: new Date().toISOString()
        })
        .eq('id', outillageId);

      if (updateError) {
        console.error('Transfert error:', updateError);
        setFormError(updateError.message || 'Erreur lors de la mise à jour de l\'outillage.');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['outillage', outillageId] });
      await queryClient.invalidateQueries({ queryKey: ['stock_movements', outillageId] });
      await queryClient.invalidateQueries({ queryKey: ['outillages'] });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Transfert error:', err);
      setFormError('Erreur inattendue lors du transfert.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-safran-navy">Déclarer un transfert</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Site destination</label>
            <select
              value={siteDestination}
              onChange={(e) => setSiteDestination(e.target.value as Site)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {SITES.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Projet destination</label>
              <select
                value={projetDestination}
                onChange={(e) => setProjetDestination(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— Conserver actuel —</option>
                {projets.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Atelier destination</label>
              <select
                value={atelierDestination}
                onChange={(e) => setAtelierDestination(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— Conserver actuel —</option>
                {ateliers.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Motif</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Raison du transfert…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Date effective</label>
            <Input type="date" value={dateEffective} onChange={(e) => setDateEffective(e.target.value)} />
          </div>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              className="border border-slate-200 bg-white text-safran-navy"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Confirmer le transfert'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
