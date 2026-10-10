'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useProjects, useArchiveProject, useRestoreProject } from '@/lib/queries/use-projects';
import { ProjectTile3D } from '@/components/canvas/project-tile-3d';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/heat-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectStatus, ProjectRole } from '@forgeline/shared';
import {
  FolderGit2,
  Plus,
  Search,
  Archive,
  RotateCcw,
  Users,
  CheckSquare,
  ArrowRight,
  Shield,
} from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();

  const { data: projects = [], isLoading } = useProjects({
    search: search.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const isAdmin = user?.globalRole === 'ADMIN';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Banner */}
      <div className="hud-panel p-5 sm:p-6 hud-corner-brackets bg-basalt/80 border-steel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-plasma mb-1">
              <FolderGit2 className="w-4 h-4" />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                WORKSPACE DIRECTORY
              </span>
            </div>
            <h1 className="font-hud uppercase tracking-wide text-2xl sm:text-3xl font-black text-bone">
              PROJECT WORKSPACES
            </h1>
            <p className="font-body text-xs sm:text-sm text-ash mt-1">
              Collaborative workspaces with real-time optimistic concurrency and role-based access control.
            </p>
          </div>

          {/* Admin-only "New Project" Button */}
          {isAdmin && (
            <div>
              <Button
                variant="primary"
                onClick={() => setCreateDialogOpen(true)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                NEW PROJECT
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-basalt/60 p-3 rounded border border-steel">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ash absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search by sector name or key (e.g. ENG)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-void"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-void p-1 rounded border border-steel self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {(['ALL', ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap min-h-[36px] ${
                statusFilter === filter
                  ? 'bg-plasma text-void font-bold'
                  : 'text-ash hover:text-bone hover:bg-steel/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Projects Grid with ProjectTile3D Tilt Slabs */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="NO PROJECT SECTORS FOUND"
          description={
            search || statusFilter !== 'ALL'
              ? 'No projects match your current telemetry filters. Adjust search parameters.'
              : 'No project workspaces initialized yet.'
          }
          actionLabel={isAdmin ? 'COMMISSION FIRST PROJECT' : undefined}
          onAction={isAdmin ? () => setCreateDialogOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isArchived = proj.status === ProjectStatus.ARCHIVED;

            return (
              <ProjectTile3D
                key={proj.id}
                role={proj.myRole}
                status={proj.status}
              >
                <div className="space-y-4">
                  {/* Top Bar: Key, Version, Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-plasma px-2 py-0.5 bg-plasma/10 border border-plasma/30 rounded">
                        [{proj.key}]
                      </span>
                      <span className="font-mono text-[10px] text-ash bg-steel/30 px-1.5 py-0.5 rounded">
                        v{proj.version}
                      </span>
                    </div>

                    <Badge
                      variant={isArchived ? 'default' : 'plasma'}
                      className="text-[10px]"
                    >
                      {proj.status}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-hud uppercase tracking-wider text-base font-bold text-bone truncate group-hover:text-plasma transition-colors">
                      {proj.name}
                    </h3>
                    <p className="font-body text-xs text-ash line-clamp-2 mt-1 min-h-[32px]">
                      {proj.description || 'No sector description registered.'}
                    </p>
                  </div>

                  {/* Stats Telemetry */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-steel/40 text-xs font-mono text-ash">
                    <div className="flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-plasma" />
                      <span>{proj._count?.tasks ?? 0} Tasks</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-ice" />
                      <span>{proj._count?.members ?? 0} Members</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-steel/60">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="inline-flex items-center text-xs font-hud uppercase tracking-wider text-plasma hover:underline min-h-[44px]"
                    >
                      OPEN PROJECT <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>

                    {/* Admin Archive / Restore Controls */}
                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        {isArchived ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={restoreProject.isPending}
                            onClick={(e) => {
                              e.preventDefault();
                              restoreProject.mutate(proj.id);
                            }}
                            className="text-[10px] h-8 text-plasma border-plasma/40"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> RESTORE
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={archiveProject.isPending}
                            onClick={(e) => {
                              e.preventDefault();
                              archiveProject.mutate(proj.id);
                            }}
                            className="text-[10px] h-8 text-ash hover:text-ember hover:border-ember/40"
                          >
                            <Archive className="w-3 h-3 mr-1" /> ARCHIVE
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ProjectTile3D>
            );
          })}
        </div>
      )}

      {/* Admin New Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
