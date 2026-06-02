'use client';

import { Badge } from '@/components/ui/badge';

export default function AlertBanner() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-amber-50 p-5 text-sm text-slate-800 shadow-sm">
      <div className="mb-2 flex items-center gap-3 text-slate-900">
        <span className="text-xl">⚠️</span>
        <h3 className="font-semibold">Alertes systèmes</h3>
      </div>
      <div className="space-y-2">
        <p>3 alertes actives. Vérifiez les outils non scannés depuis plus de 30 jours.</p>
        <Badge variant="warning">Hors zone</Badge>
      </div>
    </div>
  );
}
