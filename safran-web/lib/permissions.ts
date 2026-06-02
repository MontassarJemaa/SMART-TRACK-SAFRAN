import { Role } from '@/types';

export type PermissionAction =
  | 'alertes:view'
  | 'alertes:resend-email'
  | 'outillages:view'
  | 'outillages:actions'
  | 'inventaire:view'
  | 'inventaire:actions'
  | 'transferts:view'
  | 'transferts:actions'
  | 'rapports:view'
  | 'reglages:mon-profil'
  | 'reglages:ajouter-user'
  | 'reglages:gerer-users';

const permissions: Record<Role, PermissionAction[]> = {
  admin: [
    'alertes:view', 'alertes:resend-email',
    'outillages:view', 'outillages:actions',
    'inventaire:view', 'inventaire:actions',
    'transferts:view', 'transferts:actions',
    'rapports:view',
    'reglages:mon-profil', 'reglages:ajouter-user', 'reglages:gerer-users'
  ],
  maintenance: [
    'alertes:view', 'alertes:resend-email',
    'outillages:view', 'outillages:actions',
    'inventaire:view', 'inventaire:actions',
    'transferts:view', 'transferts:actions',
    'rapports:view',
    'reglages:mon-profil'
  ],
  superviseur: [
    'alertes:view', 'alertes:resend-email',
    'outillages:view',
    'inventaire:view',
    'transferts:view',
    'rapports:view',
    'reglages:mon-profil'
  ],
  magasin: [
    'alertes:view',
    'outillages:view',
    'inventaire:view',
    'transferts:view', 'transferts:actions',
    'rapports:view',
    'reglages:mon-profil'
  ]
};

export const hasPermission = (
  role: Role,
  action: PermissionAction
): boolean => permissions[role].includes(action);

export const hasAnyPermission = (
  role: Role,
  actions: PermissionAction[]
): boolean => actions.some(action => hasPermission(role, action));
