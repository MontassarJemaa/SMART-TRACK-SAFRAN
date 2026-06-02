'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useRowsPerPage } from '@/lib/useSettings';
import { X, ArrowLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LancerInventaireModal } from '@/components/ui/LancerInventaireModal';
import { CanAccess } from '@/components/CanAccess';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const SITES = ['CST 1', 'CST 2', 'T6', 'TTR'] as const;
type SiteSelection = (typeof SITES)[number] | 'Tous';

type CampaignStatus = 'En cours' | 'Terminée' | 'Annulée';

type Campaign = {
  id: string;
  started_at: string | null;
  site: string;
  atelier: string | null;
  total_expected: number;
  total_found: number;
  total_missing: number;
  total_unexpected: number;
  status: 'en_cours' | 'complete' | 'annule';
};

type CampaignDetail = {
  code: string | null;
  designation: string | null;
  status: 'present' | 'manquant' | 'inattendu';
  scanned_at: string | null;
};

type Counts = {
  total: number;
  'CST 1': number;
  'CST 2': number;
  'T6': number;
  'TTR': number;
};

const INITIAL_RECENTS: Campaign[] = [
  {
    id: '1',
    started_at: new Date().toISOString(),
    site: 'CST 1',
    atelier: null,
    total_expected: 842,
    total_found: 820,
    total_missing: 22,
    total_unexpected: 0,
    status: 'complete'
  },
  {
    id: '2',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    site: 'Tous',
    atelier: null,
    total_expected: 300,
    total_found: 290,
    total_missing: 10,
    total_unexpected: 0,
    status: 'complete'
  }
];

function formatDate(startedAt: string | null) {
  return startedAt
    ? new Date(startedAt).toLocaleString('fr-FR')
    : '—';
}

function campaignRateColor(rate: number) {
  if (rate >= 95) return 'bg-green-100 text-green-800';
  if (rate >= 80) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

function mapStatus(status: 'en_cours' | 'complete' | 'annule'): CampaignStatus {
  switch (status) {
    case 'en_cours':
      return 'En cours';
    case 'complete':
      return 'Terminée';
    case 'annule':
      return 'Annulée';
  }
}

function getBadgeVariant(status: CampaignStatus) {
  switch (status) {
    case 'En cours':
      return 'info';
    case 'Terminée':
      return 'success';
    case 'Annulée':
      return 'danger';
  }
}

function SiteCard({
  site,
  count,
  active,
  onClick
}: {
  site: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const isSiteMagasin = ['T6', 'TTR'].includes(site);
  const labelSuffix = isSiteMagasin ? ' outillages stockés' : ' outillages';

  return (
    <Card
      className={`!p-4 cursor-pointer transition-all ${
        active ? 'ring-2 ring-[#3b82f6] bg-[#eff6ff]' : 'hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-safran-navy">{site}</h2>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '999px',
            background: isSiteMagasin ? '#eff6ff' : '#ecfdf5',
            color: isSiteMagasin ? '#3b82f6' : '#16a34a',
            fontWeight: '600',
            width: 'fit-content'
          }}
        >
          {isSiteMagasin ? 'Magasin' : 'Production'}
        </span>
        <p className="mt-1 text-xs text-slate-500">
          {count}{labelSuffix}
        </p>
      </div>
    </Card>
  );
}

export default function InventairePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignsRef = useRef<HTMLDivElement | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteSelection>('Tous');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [page, setPage] = useState(1);
  const [showManquants, setShowManquants] = useState(false);
  const rowsPerPage = useRowsPerPage();

  const [counts, setCounts] = useState<Counts>({
    total: 0,
    'CST 1': 0,
    'CST 2': 0,
    'T6': 0,
    'TTR': 0
  });

  // Fetch all outillages with limit(2000)
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('outillages')
        .select('localisation_actuelle, statut')
        .limit(2000)

      if (data) {
        const cst1  = data.filter(o => o.localisation_actuelle === 'CST 1').length
        const cst2  = data.filter(o => o.localisation_actuelle === 'CST 2').length
        const t6    = data.filter(o => o.localisation_actuelle === 'T6').length
        const ttr   = data.filter(o => o.localisation_actuelle === 'TTR').length
        const total = data.length

        setCounts({ total, 'CST 1': cst1, 'CST 2': cst2, 'T6': t6, 'TTR': ttr })
      }
    };

    fetchData();
  }, []);

  const campaignsQuery = useQuery({
    queryKey: ['inventory_campaigns'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return { items: INITIAL_RECENTS, unavailable: false };
      }

      const { data, error } = await supabase
        .from('inventory_campaigns')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching inventory campaigns:', error);
        return { items: INITIAL_RECENTS, unavailable: true };
      }

      return { items: (data as Campaign[]) ?? INITIAL_RECENTS, unavailable: false };
    }
  });

  const allCampaigns = campaignsQuery.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(allCampaigns.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const visibleCampaigns = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return allCampaigns.slice(start, start + rowsPerPage);
  }, [currentPage, allCampaigns, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3000);
  }

  const manquantsQuery = useQuery({
    queryKey: ['inventory_campaign_details', selectedCampaign?.id],
    queryFn: async () => {
      if (!selectedCampaign || !isSupabaseConfigured) return [];
      
      const { data, error } = await supabase
        .from('inventory_campaign_details')
        .select('code, designation, status, scanned_at')
        .eq('campaign_id', selectedCampaign.id)
        .eq('status', 'manquant');
      
      if (error) {
        console.error('Error fetching manquants:', error);
        return [];
      }
      
      return data as CampaignDetail[];
    },
    enabled: !!selectedCampaign && isSupabaseConfigured
  });

  return (
    <div className="page-shell p-6 lg:p-8">
      {toastMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          {toastMessage}
        </div>
      ) : null}

      <PageHeader
        title="Inventaire & Campagnes"
        subtitle="Supervision des outillages par site"
        actions={<CanAccess action={['inventaire:actions']} mode="disable">
          <Button onClick={() => setIsModalOpen(true)}>Lancer un inventaire</Button>
        </CanAccess>}
      />

      {/* Site cards (clickable filters) */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card
          className={`!p-4 cursor-pointer transition-all ${
            selectedSite === 'Tous' ? 'ring-2 ring-[#3b82f6] bg-[#eff6ff]' : 'hover:bg-slate-50'
          }`}
          onClick={() => setSelectedSite('Tous')}
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-safran-navy">Tous les sites</h2>
            <p className="mt-1 text-xs text-slate-500">
              {counts.total} outillages
            </p>
          </div>
        </Card>
        {SITES.map((site) => (
          <SiteCard
            key={site}
            site={site}
            count={counts[site as keyof Counts]}
            active={selectedSite === site}
            onClick={() => setSelectedSite(site)}
          />
        ))}
      </section>

      {/* Campaigns */}
      <section ref={campaignsRef} className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-safran-navy">Inventaires récents</h2>
        <Card className="overflow-hidden !p-0">
          {campaignsQuery.isLoading ? (
            <div className="px-4 py-10 text-center">
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : allCampaigns.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Site</th>
                      <th className="px-4 py-3">Atelier</th>
                      <th className="px-4 py-3">Trouvés</th>
                      <th className="px-4 py-3">Manquants</th>
                      <th className="px-4 py-3">Taux</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCampaigns.map((campaign) => {
                      const taux = campaign.total_expected > 0 
                        ? Math.round((campaign.total_found / campaign.total_expected) * 100)
                        : 0;
                      const displayStatus = mapStatus(campaign.status);
                      
                      return (
                        <tr key={campaign.id} className="border-b border-slate-100 hover:bg-safran-blue/5">
                          <td className="px-4 py-3 text-slate-600">{formatDate(campaign.started_at)}</td>
                          <td className="px-4 py-3 text-slate-600">{campaign.site}</td>
                          <td className="px-4 py-3 text-slate-600">{campaign.atelier || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">{campaign.total_found}</td>
                          <td className="px-4 py-3 font-semibold text-red-700">{campaign.total_missing}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaignRateColor(taux)}`}>
                              {taux}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getBadgeVariant(displayStatus)}>
                              {displayStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button type="button" variant="outline" onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowManquants(false);
                            }}>
                              Voir détails
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page {currentPage} sur {totalPages} · {allCampaigns.length} inventaire{allCampaigns.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage <= 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Aucun inventaire récent.
            </div>
          )}
        </Card>
      </section>

      {selectedCampaign && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => {
              setSelectedCampaign(null);
              setShowManquants(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.2)',
              zIndex: 40
            }}
          />
          {/* Panneau */}
          <div style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '400px',
            background: '#fff',
            zIndex: 50,
            overflowY: 'auto',
            padding: '24px'
          }}>
            {showManquants ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-slate-700 hover:bg-transparent hover:text-safran-navy"
                    onClick={() => setShowManquants(false)}
                  >
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    Retour aux statistiques
                  </Button>
                  <button type="button" onClick={() => {
                    setSelectedCampaign(null);
                    setShowManquants(false);
                  }} className="rounded-full p-2 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-safran-navy">
                  Outillages manquants ({selectedCampaign.total_missing})
                </h3>

                <div className="space-y-3">
                  {manquantsQuery.data?.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-red-300"
                      style={{ borderColor: '#fca5a5' }}
                    >
                      <span className="text-red-500 text-xl">⚠️</span>
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: '#1a2744' }}>
                          {detail.code || 'Code inconnu'}
                        </div>
                        <div className="text-sm" style={{ color: '#6b7280' }}>
                          {detail.designation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-safran-navy">Détails inventaire</h3>
                    <p className="text-sm text-slate-500">
                      {selectedCampaign.site} · {selectedCampaign.atelier || 'Tous ateliers'} · {formatDate(selectedCampaign.started_at)}
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelectedCampaign(null)} className="rounded-full p-2 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Statistiques</p>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-safran-navy">{selectedCampaign.total_expected}</p>
                      <p className="text-xs text-slate-500">Attendus</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">{selectedCampaign.total_found}</p>
                      <p className="text-xs text-slate-500">Trouvés</p>
                    </div>
                    <div className="text-center cursor-pointer" onClick={() => setShowManquants(true)}>
                      <p className="text-2xl font-bold text-red-700">{selectedCampaign.total_missing}</p>
                      <p className="text-xs text-slate-500">Manquants</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <LancerInventaireModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={showToast} 
      />
    </div>
  );
}
