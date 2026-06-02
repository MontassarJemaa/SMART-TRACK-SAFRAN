'use client';

import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'outline' | 'custom';

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<Exclude<ButtonVariant, 'custom'>, string> = {
  primary: 'bg-safran-dark text-white hover:bg-safran-dark/90',
  outline: 'border border-slate-200 bg-white text-safran-navy hover:bg-slate-50'
};

export function Button({ className, children, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 focus:ring-safran-accent active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100',
        variant !== 'custom' && VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
