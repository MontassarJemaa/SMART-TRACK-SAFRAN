'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart2,
  BellRing,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Wrench
} from 'lucide-react';
import { useAlertesUnreadCount } from '@/lib/useAlertesUnreadCount';
import { alertPulse, sidebarItem, sidebarList } from '@/src/animations/variants';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; showAlertBadge?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/outillages', label: 'Outillages', icon: Wrench },
  { href: '/transferts', label: 'Transferts', icon: ArrowLeftRight },
  { href: '/inventaire', label: 'Inventaire', icon: ClipboardList },
  { href: '/alertes', label: 'Alertes', icon: BellRing, showAlertBadge: true },
  { href: '/rapports', label: 'Rapports', icon: BarChart2 },
  { href: '/reglages', label: 'Réglages', icon: Settings }
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: unreadAlertesCount = 0 } = useAlertesUnreadCount();
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = (variants: unknown) => (shouldReduceMotion ? undefined : (variants as any));
  const supabase = createClient();

  const handleLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(';').forEach(c => {
    document.cookie = c.replace(/^\s+/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
  window.location.href = '/login';
};

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
      className={clsx(
        'fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-safran-navy text-white'
      )}
    >
      <div
        style={{
          padding: collapsed ? '16px 7px' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div
          role={collapsed ? 'button' : undefined}
          tabIndex={collapsed ? 0 : undefined}
          onClick={collapsed ? onToggle : undefined}
          onKeyDown={(event) => {
            if (collapsed && (event.key === 'Enter' || event.key === ' ')) onToggle();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            cursor: collapsed ? 'pointer' : 'default'
          }}
          aria-label={collapsed ? 'Ouvrir le menu' : undefined}
        >
          <img
            src="/images/Logo.png"
            alt="logo"
            style={{
              height: '40px',
              width: '40px',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.5px'
                }}
              >
                SAFRAN
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '0.5px'
                }}
              >
                SMART TRACK
              </span>
            </div>
          )}
        </div>
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10"
            aria-label="Réduire le menu"
          >
            «
          </button>
        ) : null}
      </div>

      <motion.nav
        className="flex-1 space-y-1 overflow-y-auto p-2"
        variants={motionVariants(sidebarList)}
        initial={shouldReduceMotion ? false : 'initial'}
        animate="animate"
      >
        {NAV_ITEMS.map((item, index) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badgeCount = item.showAlertBadge ? unreadAlertesCount : 0;

          return (
            <motion.div
              key={item.href}
              custom={index}
              variants={motionVariants(sidebarItem)}
            >
              <Link
                href={item.href}
                title={item.label}
                className={clsx(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out motion-reduce:transition-none',
                  active
                    ? 'bg-safran-blue text-white'
                    : 'bg-transparent text-white/70 hover:bg-safran-blue hover:text-white'
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r bg-white" />
                ) : null}
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                {!collapsed ? (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 ? (
                      <motion.span
                        variants={motionVariants(alertPulse)}
                        animate={shouldReduceMotion ? undefined : 'animate'}
                        className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white"
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </motion.span>
                    ) : null}
                  </>
                ) : badgeCount > 0 ? (
                  <motion.span
                    variants={motionVariants(alertPulse)}
                    animate={shouldReduceMotion ? undefined : 'animate'}
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"
                  />
                ) : null}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Logout Button */}
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
          {!collapsed && <span className="flex-1 truncate">Se déconnecter</span>}
        </button>
      </div>

      <div className="border-t border-white/10 px-3 py-3 text-[9px] text-white/60 text-center">
        {!collapsed ? (
          <p className="mx-auto text-xs font-medium uppercase tracking-[0.18em] text-safran-blue">SAFRAN SEATS TUNISIE</p>
        ) : (
          <p className="mx-auto text-xs font-medium text-safran-blue">SST</p>
        )}
        <p className="mt-1 truncate">Designed by Montassar Jemaa</p>
      </div>
    </motion.aside>
  );
}
