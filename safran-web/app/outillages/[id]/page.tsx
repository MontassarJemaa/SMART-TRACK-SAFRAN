'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeftRight, Flame, PlayCircle, Wrench, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { TransfertModal } from '@/components/ui/TransfertModal';
import { CanAccess } from '@/components/CanAccess';
import { formatDateTime, formatRelativeScan } from '@/lib/format-date';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { DEMO_OUTILLAGES } from '@/lib/demo-data';
import { availableStatutActions, normalizeToStatutCode, statutLabel } from '@/lib/statuts';
import type { OutillageStatutOperatif } from '@/types';

const STATUT_ACTION_BUTTON_CLASS: Record<OutillageStatutOperatif, string> = {
  en_production:
    'justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
  en_etuvage:
    'justify-center gap-2 border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100',
  en_maintenance:
    'justify-center gap-2 border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100',
  perdu: 'justify-center gap-2 border border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
};

function StatutActionIcon({ statut }: { statut: OutillageStatutOperatif }) {
  switch (statut) {
    case 'en_production':
      return <PlayCircle className="h-4 w-4" />;
    case 'en_etuvage':
      return <Flame className="h-4 w-4" />;
    case 'en_maintenance':
      return <Wrench className="h-4 w-4" />;
    case 'perdu':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return null;
  }
}

type OutillageRecord = {
  id: string;
  code: string;
  designation: string;
  statut?: string | null;
  localisation_actuelle?: string | null;
  secteur?: string | null;
  magasin?: string | null;
  projet?: string | null;
  atelier?: string | null;
  longueur_cm?: number | null;
  largeur_cm?: number | null;
  hauteur_cm?: number | null;
  materiau?: string | null;
  poids_kg?: number | null;
  classe?: string | null;
  date_service?: string | null;
  date_mise_en_service?: string | null;
  epc?: string | null;
  photo_url?: string | null;
  reference_fournisseur?: string | null;
  numero_serie?: string | null;
  nb_cycles?: number | null;
  cycle_max?: number | null;
  alerte_cycle?: boolean | null;
};

type StockMovement = {
  id: string;
  modified_at: string;
  site_depart: string | null;
  site_arrivee: string | null;
  notes: string | null;
  modified_by: string | null;
};

/** Transfert = changement de site (déclaration via la modal). */
function isTransfertMovement(m: StockMovement): boolean {
  return Boolean(
    m.site_depart &&
      m.site_arrivee &&
      m.site_depart.trim() !== m.site_arrivee.trim()
  );
}

function mapDemoOutillage(id: string): OutillageRecord | null {
  const item = DEMO_OUTILLAGES.find((o) => o.id === id);
  if (!item) {
    return null;
  }

  const statut =
    item.statut === 'disponible'
      ? 'en_production'
      : item.statut === 'emprunté'
        ? 'en_etuvage'
        : item.statut === 'en maintenance'
          ? 'en_maintenance'
          : item.statut;

  return {
    id: item.id,
    code: item.code,
    designation: item.designation,
    statut,
    localisation_actuelle: item.site,
    secteur: 'Magasin A',
    projet: item.projet,
    atelier: item.atelier,
    longueur_cm: 120,
    largeur_cm: 80,
    hauteur_cm: 45,
    materiau: 'Carbone',
    poids_kg: 12.5,
    classe: 'A',
    date_mise_en_service: '2022-06-15',
    epc: 'E20034120189074000000001',
    reference_fournisseur: 'SAF-NH90-001',
    numero_serie: 'SN-2022-8841',
    nb_cycles: item.atelier === 'DRAPAGE' ? 247 : 0,
    cycle_max: 300,
    alerte_cycle: false
  };
}

async function fetchOutillage(id: string): Promise<OutillageRecord | null> {
  if (!isSupabaseConfigured) {
    return mapDemoOutillage(id);
  }

  const { data, error } = await supabase.from('outillages').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  console.log('[outillage] select(*)', data);

  return data as OutillageRecord;
}

function formatDateMiseEnService(
  row: Pick<OutillageRecord, 'date_mise_en_service' | 'date_service'>
): string {
  const raw = row.date_mise_en_service ?? row.date_service;
  if (raw == null || raw === '') {
    return '—';
  }
  try {
    return new Date(raw).toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
}

async function fetchLastScan(outillageId: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return new Date(Date.now() - 3 * 86400000).toISOString();
  }

  const { data, error } = await supabase
    .from('scan_history')
    .select('scanned_at')
    .eq('outillage_id', outillageId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.scanned_at ?? null;
}

const DEMO_MOVEMENTS: StockMovement[] = [
  {
    id: '1',
    modified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    site_depart: 'CST 1',
    site_arrivee: 'T6',
    notes: 'Transfert projet NH90',
    modified_by: null
  },
  {
    id: '2',
    modified_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    site_depart: 'T6',
    site_arrivee: 'CST 2',
    notes: 'Retour atelier',
    modified_by: null
  }
];

async function fetchMovements(outillageId: string): Promise<StockMovement[]> {
  if (!isSupabaseConfigured) {
    return DEMO_MOVEMENTS;
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('outillage_id', outillageId)
    .order('modified_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []).filter(isTransfertMovement) as StockMovement[];
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-40 rounded-3xl bg-slate-100" />
        <div className="h-48 rounded-3xl bg-slate-100" />
        <div className="h-48 rounded-3xl bg-slate-100" />
        <div className="h-56 rounded-3xl bg-slate-100" />
      </div>
      <div className="space-y-4">
        <div className="h-56 rounded-3xl bg-slate-100" />
        <div className="h-48 rounded-3xl bg-slate-100" />
      </div>
    </div>
  );
}

const ConfirmModal = ({ isOpen, titre, message, onConfirm, onCancel, type }: any) => {
  if (!isOpen) return null
  
  const colors: Record<string, string> = {
    production: '#3b82f6',
    etuvage: '#d97706',
    maintenance: '#eab308',
    perdu: '#dc2626',
    stock: '#3b82f6'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        padding: '32px', width: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Icône selon type */}
        <div style={{
          textAlign: 'center',
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          {type === 'production'  && '🔧'}
          {type === 'etuvage'     && '🔥'}
          {type === 'maintenance' && '🔨'}
          {type === 'perdu'       && '⚠️'}
          {type === 'stock'       && '📦'}
        </div>

        <h3 style={{
          textAlign: 'center',
          color: '#1a2744',
          marginBottom: '8px',
          fontSize: '18px'
        }}>{titre}</h3>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '24px'
        }}>{message}</p>

        <div style={{
          display: 'flex', gap: '12px'
        }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            cursor: 'pointer',
            color: '#374151'
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px',
            border: 'none',
            borderRadius: '8px',
            background: colors[type] || '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OutillageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;
  const [transfertOpen, setTransfertOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ titre: string; message: string; type: string; onConfirm: () => void } | null>(null);

  const {
    data: outillage,
    isLoading: outillageLoading,
    isError: outillageError
  } = useQuery({
    queryKey: ['outillage', id, isSupabaseConfigured],
    queryFn: () => fetchOutillage(id),
    enabled: Boolean(id)
  });

  const { data: lastScanAt, isLoading: scanLoading } = useQuery({
    queryKey: ['outillage-last-scan', id, isSupabaseConfigured],
    queryFn: () => fetchLastScan(id),
    enabled: Boolean(id)
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['stock_movements', id, isSupabaseConfigured],
    queryFn: () => fetchMovements(id),
    enabled: Boolean(id)
  });

  const updateStatut = useMutation({
    mutationFn: async (statut: OutillageStatutOperatif) => {
      if (!isSupabaseConfigured || !outillage) {
        return;
      }
      
      // For DRAPAGE tools: increment cycles when going to étuvage
      if (outillage.atelier === 'DRAPAGE' && statut === 'en_etuvage') {
        const newNbCycles = (outillage.nb_cycles ?? 0) + 1;
        const { error } = await supabase.from('outillages').update({ 
          statut,
          nb_cycles: newNbCycles,
          alerte_cycle: newNbCycles >= (outillage.cycle_max ?? 300)
        }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('outillages').update({ statut }).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outillage', id] });
      void queryClient.invalidateQueries({ queryKey: ['outillages'] });
    }
  });

  const resetCycles = useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured || !outillage) {
        return;
      }
      const { error } = await supabase.from('outillages').update({ 
        nb_cycles: 0,
        alerte_cycle: false
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outillage', id] });
      void queryClient.invalidateQueries({ queryKey: ['outillages'] });
      setConfirm(null);
    }
  });

  async function handleStatutChange(target: OutillageStatutOperatif, confirmMessage: string) {
    if (!outillage) {
      return;
    }
    
    // Check if it's a DRAPAGE tool trying to go to étuvage with cycles maxed
    if (
      outillage.atelier === 'DRAPAGE' && 
      target === 'en_etuvage' && 
      (outillage.nb_cycles ?? 0) >= (outillage.cycle_max ?? 300)
    ) {
      return;
    }
    
    // Map target statut to type
    let type: string;
    switch (target) {
      case 'en_production': type = 'production'; break;
      case 'en_etuvage': type = 'etuvage'; break;
      case 'en_maintenance': type = 'maintenance'; break;
      case 'perdu': type = 'perdu'; break;
      default: type = 'stock'; break;
    }
    
    // Get label for titre
    const titre = `Mettre en ${statutLabel(target)}`;
    
    setConfirm({
      titre,
      message: confirmMessage,
      type,
      onConfirm: async () => await updateStatut.mutateAsync(target)
    })
  }

  if (outillageLoading) {
    return (
      <div className="page-shell p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm font-semibold text-safran-blue hover:underline"
        >
          ← Outillages
        </button>
        <DetailSkeleton />
      </div>
    );
  }

  if (outillageError || !outillage) {
    return (
      <div className="page-shell p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm font-semibold text-safran-blue hover:underline"
        >
          ← Outillages
        </button>
        <h1 className="mb-4 text-2xl font-bold text-safran-navy">Outillage introuvable</h1>
        <Button onClick={() => router.push('/outillages')}>← Outillages</Button>
      </div>
    );
  }

  const site = outillage.localisation_actuelle ?? '—';
  const magasin = outillage.magasin ?? outillage.secteur ?? '—';
  const dimension =
    outillage.longueur_cm || outillage.largeur_cm || outillage.hauteur_cm
      ? `${outillage.longueur_cm ?? '—'} × ${outillage.largeur_cm ?? '—'} × ${outillage.hauteur_cm ?? '—'} cm`
      : '—';

  const statutCode = normalizeToStatutCode(outillage.statut) as OutillageStatutOperatif;
  const statutActions = availableStatutActions(outillage.statut);
  const isDrapage = outillage.atelier === 'DRAPAGE';
  const nbCycles = outillage.nb_cycles ?? 0;
  const cycleMax = outillage.cycle_max ?? 300;
  const isEndOfLife = isDrapage && nbCycles >= cycleMax;

  return (
    <div className="page-shell p-6 lg:p-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm font-semibold text-safran-blue hover:underline"
      >
        ← Outillages
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="!p-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              <PhotoUpload
                outillageId={outillage.id}
                currentPhotoUrl={outillage.photo_url ?? null}
                onUploadSuccess={() => {
                  void queryClient.invalidateQueries({ queryKey: ['outillage', id] });
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-lg text-safran-navy">{outillage.code}</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">{outillage.designation}</h1>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <StatutBadge statut={outillage.statut ?? 'en_production'} size="md" />
                  {isEndOfLife && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#dc2626' }}>
                      <AlertTriangle className="h-3 w-3" />
                      Fin de vie
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {isDrapage && (
            <Card className="!p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔄</span>
                <h2 className="text-lg font-semibold text-safran-navy">Cycles d'étuvage</h2>
              </div>

              <div className="space-y-4">
                {(() => {
                  const nbCycles = outillage.nb_cycles ?? 0;
                  const cycleMax = outillage.cycle_max ?? 300;
                  const percentage = Math.min(Math.round((nbCycles / cycleMax) * 100), 100);
                  const remaining = cycleMax - nbCycles;

                  let color = '#16a34a';
                  if (percentage >= 90) {
                    color = '#dc2626';
                  } else if (percentage >= 70) {
                    color = '#d97706';
                  }

                  let statusText = '';
                  if (nbCycles >= cycleMax) {
                    statusText = '🚨 Durée de vie atteinte';
                  } else if (percentage >= 90) {
                    statusText = `🚨 Fin de vie proche — ${remaining}`;
                  } else if (percentage >= 70) {
                    statusText = `⚠️ Attention — ${remaining} cycles`;
                  } else {
                    statusText = `${remaining} cycles restants`;
                  }

                  return (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                            boxShadow: percentage >= 100 ? `0 0 10px ${color}` : 'none',
                            animation: percentage >= 100 ? 'pulse 1s infinite' : 'none'
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-900">{nbCycles} / {cycleMax}</span>
                        <span className="font-semibold" style={{ color }}>{percentage}%</span>
                      </div>
                      <div className="text-xs" style={{ color: percentage >= 90 ? '#dc2626' : percentage >= 70 ? '#d97706' : '#64748b' }}>
                        {statusText}
                      </div>
                      <style jsx>{`
                        @keyframes pulse {
                          0%, 100% { opacity: 1; }
                          50% { opacity: 0.7; }
                        }
                      `}</style>
                    </>
                  );
                })()}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-safran-navy">Informations générales</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dimension" value={dimension} />
              <Field label="Matière" value={outillage.materiau ?? '—'} />
              <Field label="Classe" value={outillage.classe ?? '—'} />
              <Field label="Date de mise en service" value={formatDateMiseEnService(outillage)} />
              <div>
                <p className="text-xs text-gray-500">Statut actuel</p>
                <div className="mt-2">
                  <StatutBadge statut={outillage.statut ?? 'en_production'} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-safran-navy">Localisation actuelle</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Site" value={site} />
              <Field label="Magasin" value={magasin} />
              <Field label="Projet" value={outillage.projet ?? '—'} />
              <Field label="Atelier" value={outillage.atelier ?? '—'} />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Dernier scan :{' '}
              {scanLoading ? (
                <span className="inline-block h-4 w-32 animate-pulse rounded bg-slate-200" />
              ) : (
                <span className="font-medium text-slate-800">
                  {lastScanAt ? formatRelativeScan(lastScanAt) : '—'}
                </span>
              )}
            </p>
            <span className="mt-3 inline-flex rounded-full bg-safran-blue/10 px-3 py-1 text-sm font-semibold text-safran-navy">
              {site}
            </span>
          </Card>

          <Card className="border-safran-blue/20 shadow-md">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-safran-navy">
              <ArrowLeftRight className="h-5 w-5 text-safran-blue" />
              Historique des mouvements
            </h2>
            {movementsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500">
                <ArrowLeftRight className="h-8 w-8 text-slate-300" />
                Aucun transfert enregistré
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">De</th>
                      <th className="py-2 pr-4">Vers</th>
                      <th className="py-2 pr-4">Opérateur</th>
                      <th className="py-2">Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b border-slate-50">
                        <td className="py-2 pr-4 text-slate-600">{formatDateTime(m.modified_at)}</td>
                        <td className="py-2 pr-4">{m.site_depart ?? '—'}</td>
                        <td className="py-2 pr-4">{m.site_arrivee ?? '—'}</td>
                        <td className="py-2 pr-4">{m.modified_by ? 'Utilisateur' : 'Système'}</td>
                        <td className="py-2 text-slate-600">{m.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-safran-navy">Caractéristiques techniques</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Dimensions (L × l × H)</dt>
                <dd className="font-medium text-slate-900">
                  {outillage.longueur_cm ?? '—'} × {outillage.largeur_cm ?? '—'} ×{' '}
                  {outillage.hauteur_cm ?? '—'} cm
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Poids</dt>
                <dd className="font-medium text-slate-900">
                  {outillage.poids_kg != null ? `${outillage.poids_kg} kg` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Référence fournisseur</dt>
                <dd className="font-medium text-slate-900">{outillage.reference_fournisseur ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Numéro de série</dt>
                <dd className="font-medium text-slate-900">{outillage.numero_serie ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">EPC RFID</dt>
                <dd className="mt-1">
                  <span className="inline-block rounded-lg bg-gray-100 px-2 py-1 font-mono text-sm text-slate-800">
                    {outillage.epc ?? '—'}
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-safran-navy">Actions rapides</h2>
            <p className="mb-3 text-xs text-slate-500">
              Statut actuel :{' '}
              <span className="font-semibold text-safran-navy">{statutLabel(outillage.statut ?? statutCode)}</span>
            </p>
            <div className="flex flex-col gap-2">
              <CanAccess action={['transferts:actions']} mode="disable">
                <Button onClick={() => setTransfertOpen(true)} className="justify-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Déclarer un transfert
                </Button>
              </CanAccess>
              
              {statutActions.map((action) => {
                const isEtuvage = action.target === 'en_etuvage';
                const isDisabled = isDrapage && isEtuvage && isEndOfLife;
                
                return (
                  <div key={action.target} className="flex items-center gap-2">
                    <CanAccess action={['outillages:actions']} mode="disable">
                      <Button
                        variant="custom"
                        className={STATUT_ACTION_BUTTON_CLASS[action.target]}
                        onClick={() => void handleStatutChange(action.target, action.confirm)}
                        disabled={updateStatut.isPending || isDisabled}
                      >
                        <StatutActionIcon statut={action.target} />
                        {action.label}
                      </Button>
                    </CanAccess>
                    {isDrapage && isEtuvage && isEndOfLife && (
                      <span className="text-xs text-red-600 font-semibold whitespace-nowrap">
                        Fin de vie
                      </span>
                    )}
                  </div>
                );
              })}

              {isDrapage && isEndOfLife && (
                <CanAccess action={['outillages:actions']} mode="disable">
                  <Button
                    variant="custom"
                    className="justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                    onClick={() => {
                      setConfirm({
                        titre: 'Réinitialiser les cycles',
                        message: 'Confirmer la réinitialisation des cycles (après remplacement de l\'outillage) ?',
                        type: 'stock',
                        onConfirm: async () => await resetCycles.mutateAsync()
                      });
                    }}
                    disabled={resetCycles.isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser cycles
                  </Button>
                </CanAccess>
              )}
            </div>
          </Card>
        </div>
      </div>

      {transfertOpen ? (
        <TransfertModal
          outillageId={id}
          codeOutillage={outillage.code}
          siteDepart={site}
          projetActuel={outillage.projet}
          atelierActuel={outillage.atelier}
          statutDepart={outillage.statut}
          onClose={() => setTransfertOpen(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['outillage', id] });
            void queryClient.invalidateQueries({ queryKey: ['stock_movements', id] });
            void queryClient.invalidateQueries({ queryKey: ['outillages'] });
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={!!confirm}
        {...confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.onConfirm) {
            confirm.onConfirm()
          }
          setConfirm(null)
        }}
      />
    </div>
  );
}
