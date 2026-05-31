'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { StatutBadge } from '@/components/ui/StatutBadge';

interface OutillageCardProps {
  id: string;
  code: string;
  designation: string;
  statut: string;
  site: string;
  projet?: string;
}

export function OutillageCard({ id, code, designation, statut, site, projet }: OutillageCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/outillages/${id}`)}
      className={clsx(
        'w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition',
        'hover:ring-2 hover:ring-safran-blue/40 focus:outline-none focus:ring-2 focus:ring-safran-blue/40'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-bold text-safran-navy">{code}</span>
        <StatutBadge statut={statut} />
      </div>
      <p className="text-sm font-medium text-slate-800">{designation}</p>
      <p className="mt-2 text-xs text-slate-500">
        {site}
        {projet ? ` · ${projet}` : ''}
      </p>
    </button>
  );
}
