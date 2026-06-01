'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, ArrowLeftRight, Bell, Flame, Hammer, Info, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import ScanChart from '@/components/dashboard/ScanChart';
import { KpiSkeleton } from '@/components/dashboard/KpiSkeleton';
import {
  useEtuvageOutillages,
  useLostOutillages,
  useOutillagesAtelierDistribution,
  useOutillagesEnEtuvage,
  useOutillagesEnMaintenance,
  useOutillagesEnProduction,
  useOutillagesEnStock,
  useOutillagesPerdus,
  useOutillagesStats,
  useRecentTransfers
} from '@/lib/queries';
import { useAppSelector } from '@/lib/redux-hooks';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { formatSiteSelection } from '@/lib/utils';
import { SiteFilter } from '@/components/ui/SiteFilter';
import { isMagasin } from '@/src/utils/siteConfig';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import type { SiteSelection } from '@/types';

function relativeDate(dateIso: string | null): string {
  if (!dateIso) {
    return 'Date inconnue';
  }

  try {
    return formatDistanceToNow(new Date(dateIso), { addSuffix: true, locale: fr });
  } catch {
    return 'Date inconnue';
  }
}

function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getAlerteIconAndColor(type: string) {
  switch (type) {
    case 'critique':
      return { Icon: AlertTriangle, color: 'text-red-500', bgColor: 'border-red-100' };
    case 'avertissement':
      return { Icon: Bell, color: 'text-orange-500', bgColor: 'border-orange-100' };
    case 'information':
      return { Icon: Info, color: 'text-blue-500', bgColor: 'border-blue-100' };
    default:
      return { Icon: Info, color: 'text-slate-500', bgColor: 'border-slate-100' };
  }
}

type AlerteRow = {
  id: string;
  type: 'critique' | 'avertissement' | 'information';
  titre: string;
  description: string | null;
  site: string | null;
  created_at: string;
  lu: boolean;
};

async function fetchAlertesForDashboard() {
  if (!isSupabaseConfigured) return { list: [], count: 0 };
  
  const [listRes, countRes] = await Promise.all([
    supabase
      .from('alertes')
      .select('id, type, titre, description, site, created_at, lu')
      .eq('lu', false)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('alertes')
      .select('*', { count: 'exact', head: true })
      .eq('lu', false)
  ]);

  return {
    list: listRes.data || [],
    count: countRes.count || 0
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const siteFilter = useAppSelector((state) => state.dashboard.siteFilter);
  const statsQuery = useOutillagesStats(siteFilter);
  const enProductionQuery = useOutillagesEnProduction(siteFilter);
  const enStockQuery = useOutillagesEnStock(siteFilter);
  const enEtuvageQuery = useOutillagesEnEtuvage(siteFilter);
  const enMaintenanceQuery = useOutillagesEnMaintenance(siteFilter);
  const perdusQuery = useOutillagesPerdus(siteFilter);
  const ateliersQuery = useOutillagesAtelierDistribution(siteFilter);
  const transfersQuery = useRecentTransfers();
  const alertesQuery = useLostOutillages(siteFilter);
  const etuvageQuery = useEtuvageOutillages(siteFilter);
  const realAlertesQuery = useQuery({
    queryKey: ['dashboard-alertes'],
    queryFn: fetchAlertesForDashboard
  });

  // State for realtime alertes
  const [realtimeAlertes, setRealtimeAlertes] = useState<AlerteRow[]>(
    realAlertesQuery.data?.list || []
  );
  const [realtimeAlertesCount, setRealtimeAlertesCount] = useState<number>(
    realAlertesQuery.data?.count || 0
  );

  // Update local state when query data changes
  useEffect(() => {
    if (realAlertesQuery.data) {
      setRealtimeAlertes(realAlertesQuery.data.list);
      setRealtimeAlertesCount(realAlertesQuery.data.count);
    }
  }, [realAlertesQuery.data]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Subscribe to inserts/updates/deletes on alertes table
    const channel = supabase
      .channel('dashboard-alertes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alertes' },
        async () => {
          // Refetch the data when any change occurs
          const freshData = await fetchAlertesForDashboard();
          setRealtimeAlertes(freshData.list);
          setRealtimeAlertesCount(freshData.count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isLoading =
    statsQuery.isLoading ||
    enProductionQuery.isLoading ||
    enStockQuery.isLoading ||
    enEtuvageQuery.isLoading ||
    enMaintenanceQuery.isLoading ||
    perdusQuery.isLoading;
  const isLive = isSupabaseConfigured && statsQuery.isSuccess && !statsQuery.isError;

  const stats = statsQuery.data;
  const atelierPoints = ateliersQuery.data ?? [];
  const transfers = transfersQuery.data ?? [];
  const alertes = alertesQuery.data ?? [];
  const etuvageItems = etuvageQuery.data ?? [];
  const isMagasinSite = isMagasin(siteFilter);
  
  const enStock = enStockQuery.data ?? 0;
  const perdu = perdusQuery.data ?? 0;
  
  const donutData = [
    { name: 'En stock', value: enStock || 43, color: '#3b82f6' },
    { name: 'Perdu', value: perdu > 0 ? perdu : 0.5, 
      color: perdu > 0 ? '#dc2626' : '#f1f5f9' } 
  ];

  const kpis = stats
    ? [
        {
          label: 'Outillages suivis',
          value: String(stats.total),
          hint: `Site : ${formatSiteSelection(siteFilter)}`,
          icon: null,
          iconClassName: ''
        },
        ...(isMagasinSite
          ? [
              {
                label: 'En stock',
                value: String(enStock),
                hint: 'Statut en stock',
                icon: Hammer,
                iconClassName: 'text-blue-600'
              }
            ]
          : [
              {
                label: 'En production',
                value: String(enProductionQuery.data ?? 0),
                hint: 'Statut en production',
                icon: Hammer,
                iconClassName: 'text-blue-600'
              },
              {
                label: 'En étuvage',
                value: String(enEtuvageQuery.data ?? 0),
                hint: 'Statut en étuvage',
                icon: Flame,
                iconClassName: 'text-orange-600'
              },
              {
                label: 'En maintenance',
                value: String(enMaintenanceQuery.data ?? 0),
                hint: 'Statut en maintenance',
                icon: Wrench,
                iconClassName: 'text-yellow-500'
              }
            ]),
        {
          label: 'Perdus',
          value: String(perdu),
          hint: 'Statut perdu',
          icon: AlertTriangle,
          iconClassName: 'text-red-500'
        }
      ]
    : [];

  return (
    <div className="page-shell p-6 lg:p-8">
      <PageHeader
        title="SMART TRACK — Dashboard"
        subtitle="Suivi RFID des outillages"
        actions={
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            <SiteFilter />
            {isLive ? (
              <Badge variant="success" className="animate-pulse">
                Données live
              </Badge>
            ) : (
              <Badge variant="warning">Hors ligne</Badge>
            )}
          </div>
        }
      />

      <section className={`grid gap-4 sm:grid-cols-2 ${isMagasinSite ? 'xl:grid-cols-3' : 'xl:grid-cols-5'}`}>
        {isLoading
          ? (isMagasinSite ? [0, 75, 150] : [0, 75, 150, 225, 300]).map((delay) => <KpiSkeleton key={delay} delayMs={delay} />)
          : kpis.map((item, index) => (
              <Card
                key={item.label}
                className="animate-fade-in-up !p-5 opacity-0"
                style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  {item.icon ? (
                    <span className="rounded-xl bg-slate-50 p-2">
                      <item.icon className={`h-5 w-5 ${item.iconClassName}`} />
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold text-safran-navy">{item.value}</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.hint}</p>
              </Card>
            ))}
      </section>

      {isMagasinSite ? (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Card 1: Répartition par statut */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb', 
            padding: '20px' 
          }}> 
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1a2744', 
              marginBottom: '16px' 
            }}> 
              Répartition par statut 
            </h3> 
 
            {/* Donut centré */} 
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center' 
            }}> 
              <PieChart width={280} height={280}> 
                <Pie 
                  data={donutData} 
                  cx={140} cy={140} 
                  innerRadius={90} 
                  outerRadius={130} 
                  dataKey="value" 
                > 
                  {donutData.map((entry, i) => ( 
                    <Cell key={i} fill={entry.color} /> 
                  ))} 
                </Pie> 
                <text x={140} y={135} textAnchor="middle" 
                  dominantBaseline="middle" 
                  style={{ fontSize: '22px', fontWeight: '700', 
                    fill: '#1a2744' }}> 
                  {enStock + perdu} 
                </text> 
                <text x={140} y={155} textAnchor="middle" 
                  style={{ fontSize: '11px', fill: '#6b7280' }}> 
                  total 
                </text> 
              </PieChart> 
            </div> 
 
            {/* Légende */} 
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '24px', 
              marginTop: '12px' 
            }}> 
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}> 
                <div style={{ width: '12px', height: '12px', 
                  borderRadius: '50%', background: '#3b82f6' }}/> 
                <span style={{ fontSize: '13px', color: '#374151' }}> 
                  En stock ({enStock}) 
                </span> 
              </div> 
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}> 
                <div style={{ width: '12px', height: '12px', 
                  borderRadius: '50%', background: '#dc2626' }}/> 
                <span style={{ fontSize: '13px', color: '#374151' }}> 
                  Perdu ({perdu}) 
                </span> 
              </div> 
            </div> 
          </div>

          {/* Card 2: Alertes */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Alertes</h2>
              <Badge variant="danger">{realtimeAlertesCount}</Badge>
            </div>
            {realAlertesQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : realtimeAlertes.length ? (
              <ul className="space-y-3" style={{ flex: 1 }}>
                {realtimeAlertes.map((alerte) => {
                  const { Icon, color, bgColor } = getAlerteIconAndColor(alerte.type);
                  return (
                    <li key={alerte.id} className={`flex gap-3 rounded-2xl border ${bgColor} p-3`}>
                      <Icon className={`mt-1 h-4 w-4 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {truncate(alerte.titre, 50)}
                        </p>
                        {alerte.description && (
                          <p className="mt-1 truncate text-xs text-slate-600">
                            {truncate(alerte.description, 60)}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className="shrink-0">{alerte.site || 'Tous'}</Badge>
                          <span className="text-xs text-slate-500">{relativeDate(alerte.created_at)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '12px', fontSize: '14px', color: '#6b7280' }}>
                Aucune alerte active
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => router.push('/alertes')}
                style={{
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Voir toutes les alertes →
              </button>
            </div>
          </div>

          {/* Card 3: Transferts récents */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowLeftRight className="h-5 w-5 text-safran-blue" />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Transferts récents</h2>
            </div>
            {transfersQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : transfers.length ? (
              <ul className="space-y-3" style={{ flex: 1 }}>
                {transfers.slice(0, 3).map((transfer) => (
                  <li key={transfer.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                    <ArrowLeftRight className="mt-1 h-4 w-4 shrink-0 text-safran-blue" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {transfer.codeOutillage}
                        </p>
                        <Badge className="shrink-0 bg-safran-blue/10 text-safran-navy">
                          {transfer.siteArrivee}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {transfer.siteDepart} → {transfer.siteArrivee}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{relativeDate(transfer.date)}</p>
                      <p className="text-xs text-slate-500">{transfer.statut}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '12px', fontSize: '14px', color: '#6b7280' }}>
                Aucun transfert récent
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => router.push('/transferts')}
                style={{
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Voir tous les transferts →
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className={`mt-6 grid gap-6 lg:grid-cols-3`} style={{ alignItems: 'stretch' }}>
          {/* Normal layout */}
          <Card className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Répartition par atelier</h2>
            <div className="h-80">
              <ScanChart data={atelierPoints} isLoading={ateliersQuery.isLoading} />
            </div>
            <div style={{ display: 'flex', padding: '12px' }}>
              {['DRAPAGE', 'USINAGE', 'ASSEMBLAGE', 'EQUIPEMENT'].map((name, index) => {
                const item = atelierPoints.find((p) => p.atelier.toUpperCase() === name);
                const count = item?.count ?? 0;
                return (
                  <div
                    key={name}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      borderRight: index < 3 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                      }}
                    >
                      {name}
                    </p>
                    <p
                      style={{
                        color: '#1a2744',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginBottom: '2px'
                      }}
                    >
                      {count}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '11px' }}>outillages</p>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ArrowLeftRight className="h-5 w-5 text-safran-blue" />
              Transferts récents
            </h2>
            {transfersQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : transfers.length ? (
              <>
                <ul className="space-y-3">
                  {transfers.slice(0, 3).map((transfer) => (
                    <li key={transfer.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                      <ArrowLeftRight className="mt-1 h-4 w-4 shrink-0 text-safran-blue" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {transfer.codeOutillage}
                          </p>
                          <Badge className="shrink-0 bg-safran-blue/10 text-safran-navy">
                            {transfer.siteArrivee}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {transfer.siteDepart} → {transfer.siteArrivee}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{relativeDate(transfer.date)}</p>
                        <p className="text-xs text-slate-500">{transfer.statut}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex h-52 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                Aucun transfert récent
              </div>
            )}
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '12px'
            }}>
              <button
                onClick={() => router.push('/transferts')}
                style={{
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Voir tous les transferts →
              </button>
            </div>
          </Card>
        </section>
      )}

      {!isMagasinSite ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900">
              Étuvage en cours
              <Badge className="bg-safran-blue/10 text-safran-navy">{etuvageItems.length}</Badge>
              <span className="text-xs font-normal text-slate-500">(CST 1 & CST 2 uniquement)</span>
            </h2>
            {etuvageQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : etuvageItems.length ? (
              <>
                <div className="space-y-3">
                  {etuvageItems.slice(0, 5).map((item) => (
                    <div
                      key={`${item.code}-${item.site}`}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-safran-navy">{item.code}</p>
                        <p className="truncate text-sm text-slate-600">{item.designation}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.atelier}</p>
                      </div>
                      <Badge className="shrink-0 bg-safran-blue/10 text-safran-navy">{item.site}</Badge>
                    </div>
                  ))}
                </div>
                {etuvageItems.length > 5 && (
                  <button
                    type="button"
                    onClick={() => router.push('/outillages?statut=En étuvage')}
                    className="mt-4 w-full text-center text-sm font-semibold text-safran-blue transition hover:text-safran-navy"
                  >
                    Voir tout ({etuvageItems.length}) →
                  </button>
                )}
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                Aucun outillage en étuvage actuellement
              </div>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              Alertes
              <Badge variant="danger">{realtimeAlertesCount}</Badge>
            </h2>
            {realAlertesQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : realtimeAlertes.length ? (
              <>
                <ul className="space-y-3">
                  {realtimeAlertes.map((alerte) => {
                    const { Icon, color, bgColor } = getAlerteIconAndColor(alerte.type);
                    return (
                      <li key={alerte.id} className={`flex gap-3 rounded-2xl border ${bgColor} p-3`}>
                        <Icon className={`mt-1 h-4 w-4 shrink-0 ${color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {truncate(alerte.titre, 50)}
                          </p>
                          {alerte.description && (
                            <p className="mt-1 truncate text-xs text-slate-600">
                              {truncate(alerte.description, 60)}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className="shrink-0">{alerte.site || 'Tous'}</Badge>
                            <span className="text-xs text-slate-500">{relativeDate(alerte.created_at)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="flex h-52 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                Aucune alerte active
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push('/alertes')}
              className="mt-4 text-sm font-semibold text-safran-blue transition hover:text-safran-navy"
            >
              Voir toutes les alertes →
            </button>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
