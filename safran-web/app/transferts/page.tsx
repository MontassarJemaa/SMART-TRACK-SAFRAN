'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NouveauTransfertModal } from '@/components/ui/NouveauTransfertModal';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useRowsPerPage } from '@/lib/useSettings';

type TransfertRow = {
  id: string;
  modifiedAt: string | null;
  codeOutillage: string;
  siteDepart: string;
  siteArrivee: string;
  statut: string | null;
};

type SupabaseTransferRow = {
  id: string;
  modified_at?: string | null;
  site_depart?: string | null;
  site_arrivee?: string | null;
  statut_arrivee?: string | null;
  code_outillage?: string | null;
};

function formatDate(dateIso: string | null) {
  if (!dateIso) {
    return '—';
  }

  try {
    return new Date(dateIso).toLocaleString('fr-FR');
  } catch {
    return '—';
  }
}

function mapStatus(statut: string | null): string {
  switch (statut) {
    case 'en_production':
      return 'En production';
    case 'en_maintenance':
      return 'En maintenance';
    case 'en_etuvage':
      return 'En étuvage';
    case 'perdu':
      return 'Perdu';
    default:
      return statut || '—';
  }
}

function getBadgeVariant(statut: string | null): 'success' | 'warning' | 'danger' | 'default' {
  switch (statut) {
    case 'en_production':
      return 'success';
    case 'en_maintenance':
    case 'en_etuvage':
      return 'warning';
    case 'perdu':
      return 'danger';
    default:
      return 'default';
  }
}

function mapTransfer(row: SupabaseTransferRow): TransfertRow {
  return {
    id: row.id,
    modifiedAt: row.modified_at ?? null,
    codeOutillage: row.code_outillage ?? '—',
    siteDepart: row.site_depart ?? '—',
    siteArrivee: row.site_arrivee ?? '—',
    statut: row.statut_arrivee ?? '—'
  };
}

async function fetchTransferts(): Promise<TransfertRow[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, modified_at, site_depart, site_arrivee, statut_arrivee, code_outillage')
    .order('modified_at', { ascending: false })
    .limit(2000);

  if (error) {
    throw error;
  }

  return ((data ?? []) as SupabaseTransferRow[]).map(mapTransfer);
}

export default function TransfertsPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const rowsPerPage = useRowsPerPage();

  const transfertsQuery = useQuery({
    queryKey: ['transferts'],
    queryFn: fetchTransferts
  });

  const transferts = transfertsQuery.data ?? [];

  const sortedTransferts = useMemo(() => {
    if (!sortCol) return transferts;
    return [...transferts].sort((a, b) => {
      let va: string = '';
      let vb: string = '';

      if (sortCol === 'modifiedAt') {
        va = a.modifiedAt ?? '';
        vb = b.modifiedAt ?? '';
      } else if (sortCol === 'siteDepart') {
        va = a.siteDepart;
        vb = b.siteDepart;
      } else if (sortCol === 'siteArrivee') {
        va = a.siteArrivee;
        vb = b.siteArrivee;
      } else if (sortCol === 'statut') {
        va = a.statut ?? '';
        vb = b.statut ?? '';
      }

      return sortDir === 'asc'
        ? va.localeCompare(vb, 'fr-FR')
        : vb.localeCompare(va, 'fr-FR');
    });
  }, [transferts, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedTransferts.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedTransferts.slice(start, start + rowsPerPage);
  }, [currentPage, sortedTransferts, rowsPerPage]);

  function handleSort(col: string) {
    if (sortCol === col) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3000);
  }

  return (
    <div className="page-shell p-6 lg:p-8">
      {toastMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-safran-success px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <PageHeader
        title="Transferts & Mouvements"
        subtitle="Suivi des déplacements d’outillages entre sites SAFRAN"
        actions={<Button onClick={() => setIsModalOpen(true)}>Nouveau transfert</Button>}
      />

      <Card className="overflow-hidden !p-0 mt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th
                  className="px-4 py-[14px] cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort('modifiedAt')}
                >
                  Date
                  <span style={{ color: sortCol === 'modifiedAt' ? '#3b82f6' : '#9ca3af', marginLeft: '4px' }}>
                    {sortCol !== 'modifiedAt' ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                </th>
                <th className="px-4 py-[14px]">Outillage</th>
                <th
                  className="px-4 py-[14px] cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort('siteDepart')}
                >
                  De (site)
                  <span style={{ color: sortCol === 'siteDepart' ? '#3b82f6' : '#9ca3af', marginLeft: '4px' }}>
                    {sortCol !== 'siteDepart' ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                </th>
                <th
                  className="px-4 py-[14px] cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort('siteArrivee')}
                >
                  Vers (site)
                  <span style={{ color: sortCol === 'siteArrivee' ? '#3b82f6' : '#9ca3af', marginLeft: '4px' }}>
                    {sortCol !== 'siteArrivee' ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                </th>
                <th
                  className="px-4 py-[14px] cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort('statut')}
                >
                  Statut
                  <span style={{ color: sortCol === 'statut' ? '#3b82f6' : '#9ca3af', marginLeft: '4px' }}>
                    {sortCol !== 'statut' ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {transfertsQuery.isLoading ? (
                [...Array(6)].map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="px-4 py-[14px]" colSpan={5}>
                      <div className="h-5 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-safran-blue/5">
                    <td className="px-4 py-[14px] text-slate-600">{formatDate(row.modifiedAt)}</td>
                    <td className="px-4 py-[14px] font-medium text-slate-800">{row.codeOutillage}</td>
                    <td className="px-4 py-[14px] text-slate-600">{row.siteDepart}</td>
                    <td className="px-4 py-[14px] text-slate-600">{row.siteArrivee}</td>
                    <td className="px-4 py-[14px]">
                      <Badge variant={getBadgeVariant(row.statut)}>
                        {mapStatus(row.statut)}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ArrowLeftRight className="h-9 w-9 text-safran-blue" />
                      <p className="text-sm font-semibold">Aucun transfert enregistré</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {currentPage} sur {totalPages} · {sortedTransferts.length} transfert(s)
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
      </Card>

      {transfertsQuery.isError ? (
        <p className="mt-4 text-sm font-semibold text-safran-danger">
          Impossible de charger les transferts depuis Supabase.
        </p>
      ) : null}

      <NouveauTransfertModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={showToast} />
    </div>
  );
}
