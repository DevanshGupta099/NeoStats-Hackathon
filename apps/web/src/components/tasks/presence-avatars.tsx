'use client';

import React from 'react';
import { useSocket } from '@/lib/socket/socket-context';
import { Eye, Users } from 'lucide-react';

export function PresenceAvatars() {
  const { presenceUsers } = useSocket();

  if (presenceUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-void/80 px-2.5 py-1 rounded border border-steel/60">
      <div className="flex items-center space-x-1 text-[10px] font-mono text-ice">
        <Eye className="w-3.5 h-3.5 text-ice animate-pulse" />
        <span className="hidden sm:inline font-bold">VIEWING:</span>
      </div>

      <div className="flex items-center -space-x-1.5 overflow-hidden">
        {presenceUsers.map((user) => (
          <div
            key={user.userId}
            title={`${user.name} (@${user.handle}) [${user.role}]`}
            className="relative group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-basalt border-2 border-plasma/80 flex items-center justify-center text-[9px] font-bold text-bone">
              {user.name.charAt(0)}
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
              <div className="bg-basalt border border-steel px-2 py-1 rounded text-[10px] font-mono text-bone shadow-xl whitespace-nowrap">
                <span className="font-bold">{user.name}</span>
                <span className="text-plasma ml-1">@{user.handle}</span>
                <span className="text-ash block text-[8px] uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <span className="font-mono text-[10px] text-ash">({presenceUsers.length})</span>
    </div>
  );
}
