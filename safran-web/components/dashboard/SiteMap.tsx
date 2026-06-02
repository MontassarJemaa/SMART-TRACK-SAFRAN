'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { StatusBreakdownItem } from '@/lib/demo-data';
import { DEMO_OUTILLAGES_STATS } from '@/lib/demo-data';

const colors = ['#2E7D32', '#00A8E8', '#F9A825', '#D32F2F', '#757575', '#9E9E9E'];

interface SiteMapProps {
  data?: StatusBreakdownItem[];
  isLoading?: boolean;
}

export default function SiteMap({ data, isLoading }: SiteMapProps) {
  const chartData =
    data && data.length > 0 ? data : DEMO_OUTILLAGES_STATS.statusBreakdown;

  if (isLoading) {
    return <div className="h-full animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Aucune donnée de statut disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={52}
          paddingAngle={3}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}
