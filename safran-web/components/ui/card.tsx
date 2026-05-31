'use client';

import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-reduce:transition-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
