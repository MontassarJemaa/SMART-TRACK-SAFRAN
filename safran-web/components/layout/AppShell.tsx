'use client';

import { ReactNode, useState } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import SplashScreen from '@/src/components/SplashScreen';
import PageTransition from '@/src/components/PageTransition';

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const pathname = usePathname();
  const fitContentPage = pathname === '/rapports';
  const isLoginPage = pathname === '/login';

  return (
    <>
      {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : null}
      {!showSplash ? (
        isLoginPage ? (
          <div className="min-h-screen">
            {children}
          </div>
        ) : (
          <div className={clsx('bg-slate-50', fitContentPage ? 'h-auto min-h-0' : 'min-h-screen')}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
            <main
              className={clsx(
                'transition-all duration-300 ease-out motion-reduce:transition-none',
                fitContentPage ? 'h-auto min-h-0 pb-0' : 'min-h-screen',
                collapsed ? 'ml-14' : 'ml-[220px]'
              )}
            >
              <div className={clsx('relative', fitContentPage ? 'h-auto min-h-0 overflow-hidden' : 'min-h-screen')}>
                {/* Filigrane */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                  <Image
                    src="/images/safran-smart-track-logo.jpg"
                    alt=""
                    width={420}
                    height={420}
                    className="object-contain opacity-[0.04] select-none"
                  />
                </div>

                {/* Contenu */}
                <div className="relative z-10">
                  <AnimatePresence mode="wait" initial={false}>
                    <PageTransition key={pathname} fitContent={fitContentPage}>
                      {children}
                    </PageTransition>
                  </AnimatePresence>
                </div>
              </div>
            </main>
          </div>
        )
      ) : null}
    </>
  );
}
