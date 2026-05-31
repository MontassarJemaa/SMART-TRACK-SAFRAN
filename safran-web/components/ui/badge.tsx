'use client';

import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const classes = clsx(
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
    variant === 'success' && 'bg-green-100 text-green-800',
    variant === 'warning' && 'bg-yellow-100 text-yellow-800',
    variant === 'danger' && 'bg-red-100 text-red-800',
    variant === 'info' && 'bg-sky-100 text-sky-800',
    variant === 'default' && 'bg-slate-100 text-slate-800',
    className
  );
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
