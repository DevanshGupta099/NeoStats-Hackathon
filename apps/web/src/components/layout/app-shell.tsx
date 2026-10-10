'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from './top-nav';
import { NavRail } from './nav-rail';
import { motion, AnimatePresence } from 'motion/react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname === '/login';

  if (isPublicPage) {
    return <main className="relative z-10 w-full min-h-screen">{children}</main>;
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopNav />
      <NavRail />

      {/* Main Content Area */}
      <main className="flex-1 pt-14 pb-20 lg:pb-8 lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
