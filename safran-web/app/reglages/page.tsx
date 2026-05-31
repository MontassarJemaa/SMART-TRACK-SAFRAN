'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/lib/redux-hooks';
import { setSiteFilter } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSettings from '@/lib/useSettings';

const SITE_OPTIONS = ['Tous', 'CST 1', 'CST 2', 'T6', 'TTR'];

export default function ReglagesPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const dispatch = useAppDispatch();
  const [toastMessage, setToastMessage] = useState('');
  const [supabaseOnline, setSupabaseOnline] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      if (!isSupabaseConfigured) {
        setSupabaseOnline(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('outillages')
          .select('id')
          .limit(1);
        setSupabaseOnline(!error);
      } catch {
        setSupabaseOnline(false);
      }
    }
    void check();
  }, []);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3000);
  }

  const initials = useMemo(() => {
    const parts = (settings.nom || '').trim().split(/\s+/);
    const a = parts[0]?.[0] ?? 'S';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }, [settings.nom]);

  return (
    <div className="page-shell p-6 lg:p-8">
      {toastMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-safran-success px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <PageHeader title="Réglages" subtitle="Configuration du dashboard" />

      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-safran-blue text-white text-lg font-bold">
              {initials}
            </div>
            <h2 className="mb-0 text-lg font-semibold text-safran-navy">Profil utilisateur</h2>
          </div>

          <div className="mt-4 space-y-4">
            <div className="max-w-sm">
              <label className="mb-2 block text-sm text-slate-500">Nom affiché</label>
              <Input
                value={settings.nom}
                onChange={(e) => updateSetting('nom', e.target.value)}
                onBlur={() => showToast('Nom enregistré')}
                className="w-full"
              />
            </div>

            <div className="max-w-sm">
              <label className="mb-2 block text-sm text-slate-500">Rôle</label>
              <select
                value={settings.role}
                onChange={(e) => updateSetting('role', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-safran-blue focus:border-safran-blue"
              >
                <option>Opérateur</option>
                <option>Responsable</option>
                <option>Administrateur</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-500">Site par défaut</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SITE_OPTIONS.map((opt) => {
                  const active = settings.siteDefaut === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        updateSetting('siteDefaut', opt);
                        // dispatch to redux as well
                        dispatch(setSiteFilter(opt === 'Tous' ? 'ALL' : (opt as any)));
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        active ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  showToast('Profil mis à jour');
                }}
                className="bg-safran-navy text-white px-6 py-2 rounded-lg"
              >
                Enregistrer le profil
              </button>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <h2 className="mb-0 text-lg font-semibold text-safran-navy">Préférences d'affichage</h2>

          <div className="mt-4">
            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Langue</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateSetting('langue', 'fr')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    settings.langue === 'fr' ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => showToast('Bientôt disponible')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    settings.langue === 'en' ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Format de date</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="formatDate"
                    checked={settings.formatDate === 'dd/mm/yyyy'}
                    onChange={() => updateSetting('formatDate', 'dd/mm/yyyy')}
                  />
                  <span className="text-sm">JJ/MM/AAAA</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="formatDate"
                    checked={settings.formatDate === 'yyyy-mm-dd'}
                    onChange={() => updateSetting('formatDate', 'yyyy-mm-dd')}
                  />
                  <span className="text-sm">AAAA-MM-JJ</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nombre de lignes par tableau</label>
              <div className="flex flex-wrap gap-2">
                {[10, 100, 1000].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateSetting('nbLignesTableau', n as any)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      settings.nbLignesTableau === n ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <button
                onClick={() => {
                  resetSettings();
                  showToast('Préférences réinitialisées');
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Réinitialiser les préférences
              </button>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <h2 className="mb-2 text-lg font-semibold text-safran-navy">À propos</h2>
          <p className="text-sm text-gray-600">SAFRAN SMART TRACK — Dashboard web</p>
          <p className="mt-1 text-sm text-gray-600">Version 1.0.0 · Next.js 14 · Supabase</p>
          <p className="mt-1 text-sm text-gray-600">Designed by Montassar Jemaa</p>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
              <span className={`h-2 w-2 rounded-full bg-green-500 animate-pulse`} />
              {supabaseOnline ? 'Connecté' : 'Hors ligne'}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
