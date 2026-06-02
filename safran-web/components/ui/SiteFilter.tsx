'use client';

import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@/lib/redux-hooks';
import { setSiteFilter } from '@/lib/store';
import type { SiteSelection } from '@/types';

const SITE_OPTIONS: { value: SiteSelection; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CST 1', label: 'CST 1' },
  { value: 'CST 2', label: 'CST 2' },
  { value: 'T6', label: 'T6' },
  { value: 'TTR', label: 'TTR' }
];

export function SiteFilter() {
  const dispatch = useAppDispatch();
  const siteFilter = useAppSelector((state) => state.dashboard.siteFilter);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SITE_OPTIONS.map((option) => {
        const active = siteFilter === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => dispatch(setSiteFilter(option.value))}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              active
                ? 'bg-safran-blue text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-safran-blue'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
