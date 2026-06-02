'use client';

import { useAppSelector } from '@/lib/redux-hooks';
import type { RootState } from '@/lib/store';
import type { Role } from '@/types';

export const useRole = (): {
  role: Role;
  isAdmin: boolean;
  isMaintenance: boolean;
  isSuperviseur: boolean;
  isMagasin: boolean;
} => {
  const role = useAppSelector((state: RootState) => state.auth.role);
  return {
    role,
    isAdmin: role === 'admin',
    isMaintenance: role === 'maintenance',
    isSuperviseur: role === 'superviseur',
    isMagasin: role === 'magasin'
  };
};
