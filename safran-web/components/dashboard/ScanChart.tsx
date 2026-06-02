'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import type { AtelierDistributionItem } from '@/lib/queries';

interface AtelierChartProps {
  data?: AtelierDistributionItem[];
  isLoading?: boolean;
}

function AtelierTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-safran-navy">
        {label} — {payload[0]?.value ?? 0} outillages
      </p>
    </div>
  );
}

export default function ScanChart({ data = [], isLoading }: AtelierChartProps) {
  if (isLoading) {
    return <div className="h-full animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
        Aucune donnée atelier disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 24, left: 20, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: '#64748b' }} allowDecimals={false} />
        <YAxis
          dataKey="atelier"
          type="category"
          width={120}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip content={<AtelierTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="count" fill="#00A8E8" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
