'use client';

import { useEffect, useMemo, useState } from 'react';
import useSettings, { useRowsPerPage } from '@/lib/useSettings';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wrench } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { SiteFilter } from '@/components/ui/SiteFilter';
import { StatutBadge } from '@/components/ui/StatutBadge';
import {
  OUTILLAGES_PAGE_SIZE_OPTIONS,
  type OutillagesPageSize,
  useOutillagesPaginated
} from '@/lib/queries';
import { useAppSelector } from '@/lib/redux-hooks';
import { useDebounce } from '@/lib/useDebounce';
import { useAtelierOptions, useProjetOptions } from '@/lib/outillage-hooks';
import { statutLabel } from '@/lib/statuts';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getStatutsBySite, isMagasin } from '@/src/utils/siteConfig';

function formatLastScan(dateIso: string | null | undefined) {
  if (!dateIso) {
    return '—';
  }
  try {
    return formatDistanceToNow(new Date(dateIso), { addSuffix: true, locale: fr });
  } catch {
    return '—';
  }
}

const selectClass =
  'rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-safran-blue focus:border-safran-blue focus:outline-none';

function MiniCycleProgress({ nbCycles, cycleMax }: { nbCycles?: number | null, cycleMax?: number | null }) {
  const current = nbCycles ?? 0;
  const max = cycleMax ?? 300;
  const percentage = Math.min(Math.round((current / max) * 100), 100);

  let color = '#16a34a';
  if (percentage >= 90) {
    color = '#dc2626';
  } else if (percentage >= 70) {
    color = '#d97706';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{current}/{max}</span>
    </div>
  );
}

function TableRowsSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function OutillagesPage() {
  const router = useRouter();
  const siteFilter = useAppSelector((state) => state.dashboard.siteFilter);
  const { settings } = useSettings();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<OutillagesPageSize>(settings.nbLignesTableau);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [statutFilter, setStatutFilter] = useState('tous');
  const [projetFilter, setProjetFilter] = useState('tous');
  const [atelierFilter, setAtelierFilter] = useState('tous');

  const { data: projets = [], isLoading: projetsLoading } = useProjetOptions();
  const { data: ateliers = [], isLoading: ateliersLoading } = useAtelierOptions();
  const isMagasinSite = isMagasin(siteFilter);
  const statutOptions = getStatutsBySite(siteFilter);
  const showCyclesColumn = atelierFilter === 'DRAPAGE';

  useEffect(() => {
    setPageSize(settings.nbLignesTableau);
  }, [settings.nbLignesTableau]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      statut: statutFilter,
      site: siteFilter,
      projet: projetFilter,
      atelier: atelierFilter
    }),
    [debouncedSearch, statutFilter, siteFilter, projetFilter, atelierFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter, siteFilter, projetFilter, atelierFilter, pageSize]);

  useEffect(() => {
    if (isMagasinSite && atelierFilter !== 'tous') {
      setAtelierFilter('tous');
    }
    if (statutFilter !== 'tous' && !statutOptions.includes(statutFilter)) {
      setStatutFilter('tous');
    }
  }, [atelierFilter, isMagasinSite, statutFilter, statutOptions]);

  const { data, isLoading, isFetching, isPlaceholderData } = useOutillagesPaginated(page, pageSize, filters);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const showInitialSkeleton = isLoading && items.length === 0;
  const showRowSkeleton = isFetching && (isPlaceholderData || items.length === 0);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function handlePageSizeChange(value: string) {
    const next = Number(value) as OutillagesPageSize;
    setPage(1);
    setPageSize(next);
  }

  return (
    <div className="page-shell p-6 lg:p-8">
      <PageHeader
        title="Outillages"
        subtitle={
          isSupabaseConfigured
            ? 'Référentiel Supabase — filtres et pagination serveur'
            : 'Référentiel — mode démo'
        }
      />

      <Card className="mb-6 space-y-4 !p-4">
        <div className="flex items-center flex-wrap gap-2">
          <SiteFilter />
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={projetFilter}
              onChange={(e) => setProjetFilter(e.target.value)}
              className={selectClass}
              disabled={projetsLoading}
            >
              <option value="tous">Tous les projets</option>
              {projets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {!isMagasinSite ? (
              <select
                value={atelierFilter}
                onChange={(e) => setAtelierFilter(e.target.value)}
                className={selectClass}
                disabled={ateliersLoading}
              >
                <option value="tous">Tous les ateliers</option>
                {ateliers.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ) : null}

            <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className={selectClass}>
              <option value="tous">Tous les statuts</option>
              {statutOptions.map((s) => (
                <option key={s} value={s}>
                  {statutLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          placeholder="Rechercher par code, désignation, projet, atelier, site…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </Card>

      <p className="mb-3 text-sm font-semibold text-slate-600">
        {showInitialSkeleton ? (
          <span className="inline-block h-4 w-48 animate-pulse rounded bg-slate-200" />
        ) : (
          <>
            {total.toLocaleString('fr-FR')} outillage{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
            {isFetching && !showInitialSkeleton ? (
              <span className="ml-2 text-xs font-normal text-slate-400">Mise à jour…</span>
            ) : null}
          </>
        )}
      </p>

      {showInitialSkeleton ? (
        <TableSkeleton cols={showCyclesColumn ? 9 : 8} />
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Désignation</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Projet</th>
                  <th className="px-4 py-3">Atelier</th>
                  {showCyclesColumn && <th className="px-4 py-3">Cycles</th>}
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Dernier scan</th>
                </tr>
              </thead>
              <tbody>
                {showRowSkeleton ? (
                  <TableRowsSkeleton rows={pageSize > 10 ? 10 : pageSize} cols={showCyclesColumn ? 9 : 8} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={showCyclesColumn ? 9 : 8} className="px-4 py-8 text-center text-slate-500">
                      Aucun outillage trouvé.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/outillages/${row.id}`)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-safran-blue/5"
                    >
                      <td className="px-4 py-3">
                        {row.photo_url ? (
                          <img
                            src={row.photo_url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100">
                            <Wrench className="h-4 w-4 text-safran-navy/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-safran-navy">{row.code}</td>
                      <td className="px-4 py-3 text-slate-800">{row.designation}</td>
                      <td className="px-4 py-3 text-slate-600">{row.site}</td>
                      <td className="px-4 py-3 text-slate-600">{row.projet}</td>
                      <td className="px-4 py-3 text-slate-600">{isMagasinSite ? '—' : row.atelier}</td>
                      {showCyclesColumn && (
                        <td className="px-4 py-3">
                          <MiniCycleProgress nbCycles={row.nb_cycles} cycleMax={row.cycle_max} />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <StatutBadge statut={row.statut} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatLastScan(row.lastScanAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                Page {page} / {totalPages}
              </span>
              <label className="flex items-center gap-2">
                Lignes
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className={selectClass}
                >
                  {OUTILLAGES_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                className="border border-slate-200 bg-white text-safran-navy hover:bg-slate-50"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                ← Précédent
              </Button>
              <Button
                className="border border-slate-200 bg-white text-safran-navy hover:bg-slate-50"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
