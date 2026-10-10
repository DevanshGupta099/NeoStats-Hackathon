'use client';

import React from 'react';
import { ProjectMember } from '@/lib/queries/use-projects';
import { Badge } from '@/components/ui/badge';
import { ProjectRole } from '@forgeline/shared';
import { ShieldCheck, User, Calendar } from 'lucide-react';

export function ProjectTeamTab({ members }: { members: ProjectMember[] }) {
  if (members.length === 0) {
    return (
      <div className="hud-panel p-8 text-center bg-basalt border-steel border-dashed rounded text-xs font-mono text-ash">
        NO ROSTER ROLES CURRENTLY ASSIGNED
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((m) => {
        const isManager = m.projectRole === ProjectRole.MANAGER;
        const isMember = m.projectRole === ProjectRole.MEMBER;

        return (
          <div
            key={m.userId}
            className={`hud-panel p-4 bg-basalt border rounded flex items-start space-x-3 transition-colors ${
              isManager
                ? 'border-l-4 border-l-plasma border-steel'
                : isMember
                ? 'border-l-4 border-l-ice border-steel'
                : 'border-l-4 border-l-ash border-steel'
            }`}
          >
            <div className="w-10 h-10 rounded bg-graphite border border-steel flex items-center justify-center font-hud text-base font-bold text-bone flex-shrink-0">
              {m.user.name.charAt(0)}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-hud uppercase tracking-wide text-xs font-bold text-bone truncate">
                  {m.user.name}
                </h4>
                <Badge
                  variant={isManager ? 'plasma' : isMember ? 'ice' : 'default'}
                  className="text-[9px] px-1.5 py-0"
                >
                  {m.projectRole}
                </Badge>
              </div>

              <span className="font-mono text-[10px] text-ash block truncate">
                @{m.user.handle} &bull; {m.user.email}
              </span>

              <div className="flex items-center space-x-1 text-[9px] font-mono text-ash/60 pt-1 border-t border-steel/40">
                <Calendar className="w-3 h-3 text-steel" />
                <span>Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
