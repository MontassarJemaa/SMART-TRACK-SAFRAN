import clsx from 'clsx';
import { statutColor, statutLabel } from '@/lib/statuts';

interface StatutBadgeProps {
  statut: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatutBadge({ statut, className, size = 'sm' }: StatutBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold',
        statutColor(statut),
        size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
        className
      )}
    >
      {statutLabel(statut)}
    </span>
  );
}
