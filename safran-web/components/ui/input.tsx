'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={clsx(
      'w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-safran-accent focus:ring-2 focus:ring-safran-accent/20',
      className
    )}
  />
));

Input.displayName = 'Input';
