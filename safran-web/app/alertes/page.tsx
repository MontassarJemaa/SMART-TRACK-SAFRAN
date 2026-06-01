'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Bell, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AlerteType = 'critique' | 'avertissement' | 'information';

type AlerteRow = {
  id: string;
  type: AlerteType;
  titre: string;
  description: string | null;
  site: string | null;
  outillage_id: string | null;
  lu: boolean;
  lu_at: string | null;
  created_at: string;
  email_sent: boolean | null;
  notified_at: string | null;
};

type OutillageRow = {
  id: string;
  reference?: string | null;
  code?: string | null;
  designation?: string | null;
  statut?: string | null;
  site?: string | null;
  localisation_actuelle?: string | null;
  updated_at?: string | null;
  atelier?: string | null;
  nb_cycles?: number | null;
  cycle_max?: number | null;
};

type GeneratedAlerte = {
  type: AlerteType;
  titre: string;
  description: string;
  site: string | null;
  outillage_id: string | null;
};

type SectionConfig = {
  type: AlerteType;
  title: string;
  emptyLabel: string;
  icon: typeof AlertTriangle;
  iconColor: string;
  borderColor: string;
};

const REFRESH_INTERVAL_MS = 60_000;

const SECTIONS: SectionConfig[] = [
  {
    type: 'critique',
    title: 'Critiques',
    emptyLabel: 'critique',
    icon: AlertTriangle,
    iconColor: '#dc2626',
    borderColor: 'border-red-200'
  },
  {
    type: 'avertissement',
    title: 'Avertissements',
    emptyLabel: 'avertissement',
    icon: Bell,
    iconColor: '#d97706',
    borderColor: 'border-amber-200'
  },
  {
    type: 'information',
    title: 'Informations',
    emptyLabel: 'information',
    icon: Info,
    iconColor: '#3b82f6',
    borderColor: 'border-blue-200'
  }
];

const TYPE_EMOJI: Record<AlerteType, string> = {
  critique: '⚠️',
  avertissement: '🔔',
  information: 'ℹ️'
};

function getOutillageReference(outillage: OutillageRow) {
  return outillage.reference || outillage.code || 'Outillage';
}

function getOutillageSite(outillage: OutillageRow) {
  return outillage.site || outillage.localisation_actuelle || null;
}

function isOlderThan24h(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now() - 24 * 60 * 60 * 1000;
}

function relativeDate(dateIso: string) {
  try {
    return formatDistanceToNow(new Date(dateIso), { addSuffix: true, locale: fr });
  } catch {
    return 'date inconnue';
  }
}

async function fetchOutillages(): Promise<OutillageRow[]> {
  const primary = await supabase
    .from('outillages')
    .select('id, code, designation, statut, localisation_actuelle, updated_at, atelier, nb_cycles, cycle_max')
    .order('updated_at', { ascending: false });

  if (!primary.error) return (primary.data ?? []) as OutillageRow[];

  const fallback = await supabase
    .from('outillages')
    .select('id, reference, designation, statut, site, updated_at')
    .order('updated_at', { ascending: false });

  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []) as OutillageRow[];
}

function buildAlertes(outillages: OutillageRow[]): GeneratedAlerte[] {
  const generated: GeneratedAlerte[] = [];

  outillages.forEach((outillage) => {
    const reference = getOutillageReference(outillage);
    const designation = outillage.designation || 'sans désignation';
    const site = getOutillageSite(outillage);

    if (outillage.statut === 'perdu') {
      generated.push({
        type: 'critique',
        titre: `${reference} — ${designation} déclaré perdu`,
        description: `L'outillage ${reference} est déclaré perdu et nécessite une action immédiate.`,
        site,
        outillage_id: outillage.id
      });
    }

    if (outillage.statut === 'en_maintenance' && isOlderThan24h(outillage.updated_at)) {
      generated.push({
        type: 'avertissement',
        titre: `${reference} en maintenance depuis +24h — vérification requise`,
        description: `L'outillage ${reference} est en maintenance depuis plus de 24 heures.`,
        site,
        outillage_id: outillage.id
      });
    }

    if (outillage.atelier === 'DRAPAGE') {
      const nbCycles = outillage.nb_cycles ?? 0;
      const cycleMax = outillage.cycle_max ?? 300;
      
      if (nbCycles >= cycleMax) {
        generated.push({
          type: 'critique',
          titre: `${reference} — Durée de vie atteinte (${nbCycles}/${cycleMax} cycles) — Remplacement requis`,
          description: `L'outillage ${reference} a atteint sa durée de vie maximale de ${cycleMax} cycles et doit être remplacé.`,
          site,
          outillage_id: outillage.id
        });
      } else if (nbCycles >= cycleMax * 0.9) {
        generated.push({
          type: 'avertissement',
          titre: `${reference} — Fin de vie proche (${nbCycles}/${cycleMax} cycles)`,
          description: `L'outillage ${reference} approche de sa durée de vie maximale (${Math.round((nbCycles / cycleMax) * 100)}%).`,
          site,
          outillage_id: outillage.id
        });
      }
    }
  });

  generated.push({
    type: 'information',
    titre: `Données synchronisées — ${outillages.length} outillages chargés`,
    description: 'La synchronisation Supabase des outillages a été effectuée avec succès.',
    site: 'Tous sites',
    outillage_id: null
  });

  return generated;
}

async function persistGeneratedAlertes(generated: GeneratedAlerte[]) {
  const outillageAlertes = generated.filter((alerte) => alerte.outillage_id);
  const outillageIds = outillageAlertes.map((alerte) => alerte.outillage_id as string);

  if (outillageIds.length > 0) {
    const { data: existing, error } = await supabase
      .from('alertes')
      .select('id, type, outillage_id')
      .in('outillage_id', outillageIds)
      .in('type', ['critique', 'avertissement']);

    if (error) throw error;

    const existingKeys = new Set(
      (existing ?? []).map((alerte) => `${alerte.outillage_id}:${alerte.type}`)
    );
    const missing = outillageAlertes.filter(
      (alerte) => !existingKeys.has(`${alerte.outillage_id}:${alerte.type}`)
    );

    if (missing.length > 0) {
      const { error: insertError } = await supabase.from('alertes').insert(missing);
      if (insertError) throw insertError;
    }
  }

  const info = generated.find((alerte) => alerte.type === 'information');
  if (!info) return;

  const { data: existingInfo, error: infoError } = await supabase
    .from('alertes')
    .select('id, lu')
    .eq('type', 'information')
    .is('outillage_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (infoError) throw infoError;

  if (!existingInfo) {
    const { error: insertInfoError } = await supabase.from('alertes').insert(info);
    if (insertInfoError) throw insertInfoError;
    return;
  }

  if (!existingInfo.lu) {
    const { error: updateInfoError } = await supabase
      .from('alertes')
      .update({
        titre: info.titre,
        description: info.description,
        site: info.site,
        created_at: new Date().toISOString()
      })
      .eq('id', existingInfo.id);

    if (updateInfoError) throw updateInfoError;
  }
}

async function fetchPersistedAlertes(): Promise<AlerteRow[]> {
  const { data, error } = await supabase
    .from('alertes')
    .select('id, type, titre, description, site, outillage_id, lu, lu_at, created_at, email_sent, notified_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AlerteRow[];
}

async function generateAndFetchAlertes(): Promise<AlerteRow[]> {
  if (!isSupabaseConfigured) return [];

  const outillages = await fetchOutillages();
  await persistGeneratedAlertes(buildAlertes(outillages));
  return fetchPersistedAlertes();
}

async function markAlerteAsRead(id: string) {
  const { error } = await supabase
    .from('alertes')
    .update({ lu: true, lu_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

async function markAllAlertesAsRead() {
  const { error } = await supabase
    .from('alertes')
    .update({ lu: true, lu_at: new Date().toISOString() })
    .eq('lu', false);

  if (error) throw error;
}

async function resendEmail(alerteId: string) {
  // First, reset email_sent and notified_at to false/null
  const { error: resetError } = await supabase
    .from('alertes')
    .update({ email_sent: false, notified_at: null })
    .eq('id', alerteId);

  if (resetError) throw resetError;

  // Call the Supabase Edge Function to resend the email
  const { data, error: functionError } = await supabase.functions.invoke('send-alert-email', {
    body: { alerteId }
  });

  if (functionError) throw functionError;
  
  return data;
}

export default function AlertesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showRead, setShowRead] = useState(false);

  const alertesQuery = useQuery({
    queryKey: ['alertes'],
    queryFn: generateAndFetchAlertes,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: 1
  });

  const markReadMutation = useMutation({
    mutationFn: markAlerteAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['alertes'] });
      await queryClient.invalidateQueries({ queryKey: ['alertes-unread-count'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAlertesAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['alertes'] });
      await queryClient.invalidateQueries({ queryKey: ['alertes-unread-count'] });
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: resendEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['alertes'] });
    }
  });

  const allAlertes = alertesQuery.data ?? [];
  const visibleAlertes = useMemo(
    () => allAlertes.filter((alerte) => showRead || !alerte.lu),
    [allAlertes, showRead]
  );
  const unreadCount = allAlertes.filter((alerte) => !alerte.lu).length;

  function handleView(alerte: AlerteRow) {
    if (alerte.outillage_id) {
      router.push(`/outillages/${alerte.outillage_id}`);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="page-shell h-auto min-h-0 space-y-8 bg-[#f4f6f9] p-6 lg:p-8" style={{ minHeight: 'auto', background: '#f4f6f9' }}>
      <PageHeader 
        title="Alertes" 
        subtitle="Alertes dynamiques et persistantes depuis Supabase"
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1a2744]">
            {unreadCount} alerte{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-500">Les alertes lues restent sauvegardées dans Supabase.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showRead}
              onChange={(event) => setShowRead(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#3b82f6]"
            />
            Afficher les lues aussi
          </label>
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            className="border-[#1a2744] text-[#1a2744]"
          >
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      {alertesQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#3b82f6]" />
          Chargement des alertes...
        </div>
      ) : alertesQuery.isError ? (
        <Card className="border-l-4 border-red-200 !p-4 text-sm text-red-700">
          Impossible de charger les alertes depuis Supabase.
        </Card>
      ) : visibleAlertes.length === 0 ? (
        <Card className="flex items-center gap-3 !p-5 text-sm text-slate-600">
          <CheckCircle2 className="h-5 w-5 text-[#16a34a]" />
          Aucune alerte active
        </Card>
      ) : (
        SECTIONS.map((section) => {
          const items = visibleAlertes.filter((alerte) => alerte.type === section.type);
          const Icon = section.icon;

          return (
            <section key={section.type}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1a2744]">
                <span aria-hidden="true">{TYPE_EMOJI[section.type]}</span>
                <Icon className="h-5 w-5" style={{ color: section.iconColor }} />
                {section.title}
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                  {items.length}
                </span>
              </h2>

              <div className="space-y-3">
                {items.length ? (
                  items.map((alerte) => (
                    <Card
                      key={alerte.id}
                      className={`flex flex-col gap-4 border-l-4 ${section.borderColor} !p-4 transition-opacity sm:flex-row sm:items-center sm:justify-between ${
                        alerte.lu ? 'opacity-55' : 'opacity-100'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="mt-0.5 text-lg" aria-hidden="true">
                          {TYPE_EMOJI[alerte.type]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{alerte.titre}</p>
                          {alerte.description ? (
                            <p className="mt-1 text-sm text-slate-600">{alerte.description}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-slate-500">
                            {alerte.site ?? 'Site non renseigné'} · {relativeDate(alerte.created_at)}
                            {alerte.lu && alerte.lu_at ? ` · lu ${relativeDate(alerte.lu_at)}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {/* Email Status Icon */}
                        <div className="flex items-center gap-1">
                          {alerte.email_sent ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : alerte.email_sent === false ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Loader2 className="h-4 w-4 text-slate-400" />
                          )}
                          <span className="text-xs text-slate-500">
                            {alerte.email_sent ? 'Email envoyé' : alerte.email_sent === false ? 'Email échoué' : 'En attente'}
                          </span>
                        </div>
                        
                        <Button variant="outline" className="px-3" onClick={() => handleView(alerte)}>
                          Voir
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => resendEmailMutation.mutate(alerte.id)}
                          disabled={resendEmailMutation.isPending}
                          className="px-3 py-1 text-xs"
                        >
                          {resendEmailMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : 'Renvoyer email'}
                        </Button>
                        
                        {!alerte.lu ? (
                          <button
                            onClick={() => markReadMutation.mutate(alerte.id)}
                            disabled={markReadMutation.isPending}
                            className="whitespace-nowrap rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            ✓ Lu
                          </button>
                        ) : null}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="flex items-center gap-3 !p-4 text-sm text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-[#16a34a]" />
                    Aucune alerte {section.emptyLabel}
                  </Card>
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
