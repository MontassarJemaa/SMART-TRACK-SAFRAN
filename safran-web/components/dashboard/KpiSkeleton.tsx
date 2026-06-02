import { Card } from '@/components/ui/card';

export function KpiSkeleton({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <Card className="!p-5" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-9 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
    </Card>
  );
}
