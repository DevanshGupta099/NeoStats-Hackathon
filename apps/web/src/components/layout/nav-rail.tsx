'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderGit2, Bell, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: 3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export function NavRail() {
  const pathname = usePathname();

  return (
    <>
      {/* 1. Desktop Left Rail (lg screens) */}
      <aside className="hidden lg:flex fixed top-14 left-0 bottom-0 w-64 bg-basalt border-r border-steel flex-col justify-between py-6 px-4 z-30">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-mono text-[10px] text-ash/60 uppercase tracking-widest">
              NAVIGATION
            </span>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 font-hud uppercase tracking-wider text-xs transition-all duration-150 border ${
                    isActive
                      ? 'bg-plasma/10 text-plasma border-plasma/40 shadow-[inset_2px_0_0_0_#B8FF2C]'
                      : 'text-ash border-transparent hover:text-bone hover:bg-graphite hover:border-steel'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-crimson/20 border border-crimson/50 text-crimson font-mono text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System telemetry footer */}
        <div className="p-3 bg-void border border-steel/60">
          <div className="flex justify-between items-center text-[10px] font-mono text-ash/70 mb-1">
            <span>CORE STATUS</span>
            <span className="text-plasma">OPTIMAL</span>
          </div>
          <div className="w-full bg-steel h-1">
            <div className="bg-plasma h-1 w-3/4" />
          </div>
        </div>
      </aside>

      {/* 2. Mobile Thumb-Zone Bottom Tab Bar (< lg screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-basalt/95 backdrop-blur border-t border-steel z-40 px-2 flex items-center justify-around safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-12 min-h-[44px] min-w-[44px] relative transition-colors ${
                isActive ? 'text-plasma' : 'text-ash hover:text-bone'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="font-hud text-[10px] uppercase tracking-wider">
                {item.label}
              </span>

              {item.badge && (
                <span className="absolute top-1 right-3 w-2 h-2 bg-crimson rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
