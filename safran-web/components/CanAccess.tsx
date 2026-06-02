'use client';

import { ReactNode, useMemo } from 'react';
import { useRole } from '@/hooks/useRole';
import { hasAnyPermission } from '@/lib/permissions';
import type { PermissionAction } from '@/lib/permissions';
import type { Role } from '@/types';

interface CanAccessProps {
  children: ReactNode;
  /**
   * Either an array of roles or an array of permission actions
   */
  role?: Role[];
  action?: PermissionAction[];
  /**
   * 'disable' → grise et désactive, 'hide' → masque complètement
   */
  mode: 'disable' | 'hide';
}

export const CanAccess = ({
  children,
  role,
  action,
  mode
}: CanAccessProps) => {
  const { role: currentRole } = useRole();

  const isAllowed = useMemo(() => {
    if (role && role.length > 0) {
      return role.includes(currentRole);
    }
    if (action && action.length > 0) {
      return hasAnyPermission(currentRole, action);
    }
    // If neither role or action are provided, assume allowed
    return true;
  }, [currentRole, role, action]);

  if (!isAllowed && mode === 'hide') {
    return null;
  }

  if (!isAllowed && mode === 'disable') {
    return (
      <div
        className="opacity-40 cursor-not-allowed pointer-events-none"
        title="Accès restreint — contactez un administrateur"
      >
        {children}
      </div>
    );
  }

  return <>{children}</>;
};
