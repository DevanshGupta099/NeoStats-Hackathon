'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  useProject,
  useProjectStats,
  useProjectMembers,
} from '@/lib/queries/use-projects';
import {
  useProjectTasks,
  TaskFilters,
  TaskItem,
} from '@/lib/queries/use-tasks';
import { usePermissions } from '@/lib/permissions-hook';
import { TaskBoard } from '@/components/tasks/task-board';
import { TaskListView } from '@/components/tasks/task-list-view';
import { TaskFilterDrawer } from '@/components/tasks/task-filter-drawer';
import { CreateTaskSheet } from '@/components/tasks/create-task-sheet';
import { TaskDetailContent } from '@/components/tasks/task-detail-content';
import { ProjectTeamTab } from '@/components/projects/project-team-tab';
import { ProjectActivityTab } from '@/components/projects/project-activity-tab';
import { ProjectDigestSheet } from '@/components/projects/project-digest-sheet';
import { PresenceAvatars } from '@/components/tasks/presence-avatars';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import { Drawer } from 'vaul';
import { Permissions, ProjectRole } from '@forgeline/shared';
import {
  LayoutGrid,
  List,
  Plus,
  Users,
  Activity,
  Kanban,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = String(params.id);

  const initialTab = searchParams.get('tab') || 'tasks';
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'activity'>(
    (initialTab as any) || 'tasks',
  );
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Queries
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: stats } = useProjectStats(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: taskData, isLoading: tasksLoading } = useProjectTasks(projectId, filters);

  const tasks = taskData?.items || [];

  // Determine current user's project role
  const myMember = members.find((m) => m.userId === project?.createdById); // fallback
  const { can } = usePermissions(project?.myRole, projectId);
  const canCreateTask = can(Permissions.TASK_CREATE);

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <HeatSkeleton className="h-32 w-full" />
        <HeatSkeleton className="h-16 w-full" />
        <HeatSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="hud-panel p-12 text-center bg-basalt border-steel rounded text-xs font-mono text-ash">
        PROJECT SECTOR NOT FOUND OR AUTHORIZATION DENIED
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Project Sector Header & Stat Bar */}
      <div className="hud-panel p-5 sm:p-7 hud-corner-brackets bg-basalt/85 border-steel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/projects')}
                className="h-7 px-2 text-[10px]"
              >
                <ArrowLeft className="w-3 h-3 mr-1" /> ALL SECTORS
              </Button>
              <span className="font-mono text-xs font-bold text-plasma px-2 py-0.5 bg-plasma/10 border border-plasma/30 rounded">
                [{project.key}]
              </span>
              <span className="font-mono text-[10px] text-ash bg-steel/30 px-1.5 py-0.5 rounded">
                v{project.version}
              </span>
              <Badge variant="plasma" className="text-[10px]">
                {project.status}
              </Badge>
            </div>

            <h1 className="font-hud uppercase tracking-wide text-2xl sm:text-3xl font-black text-bone">
              {project.name}
            </h1>

            {project.description && (
              <p className="font-body text-xs sm:text-sm text-ash max-w-2xl">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-void/60 p-3 rounded border border-steel/60 text-xs font-mono">
            <div className="p-2 bg-graphite/40 rounded">
              <span className="text-ash/70 block text-[10px]">TOTAL TASKS</span>
              <span className="text-base font-bold text-bone">{stats?.totalTasks ?? 0}</span>
            </div>
            <div className="p-2 bg-graphite/40 rounded">
              <span className="text-plasma block text-[10px]">IN PROGRESS</span>
              <span className="text-base font-bold text-plasma">{stats?.inProgressTasks ?? 0}</span>
            </div>
            <div className="p-2 bg-graphite/40 rounded">
              <span className="text-ice block text-[10px]">COMPLETED</span>
              <span className="text-base font-bold text-ice">{stats?.completedTasks ?? 0}</span>
            </div>
            <div className="p-2 bg-graphite/40 rounded">
              <span className="text-ash block text-[10px]">TEAM SIZE</span>
              <span className="text-base font-bold text-bone">{stats?.memberCount ?? members.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Segmented Navigation Tabs: Tasks | Team | Activity */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-steel/60 pb-3">
        <div className="flex items-center space-x-2 bg-basalt p-1 rounded border border-steel self-start">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-hud uppercase tracking-wider transition-colors min-h-[44px] ${
              activeTab === 'tasks'
                ? 'bg-plasma text-void font-bold shadow'
                : 'text-ash hover:text-bone hover:bg-steel/30'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>TASKS</span>
            <span className="text-[10px] opacity-80">({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-hud uppercase tracking-wider transition-colors min-h-[44px] ${
              activeTab === 'team'
                ? 'bg-plasma text-void font-bold shadow'
                : 'text-ash hover:text-bone hover:bg-steel/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>TEAM</span>
            <span className="text-[10px] opacity-80">({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-hud uppercase tracking-wider transition-colors min-h-[44px] ${
              activeTab === 'activity'
                ? 'bg-plasma text-void font-bold shadow'
                : 'text-ash hover:text-bone hover:bg-steel/30'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>ACTIVITY</span>
          </button>
        </div>

        {/* Task Tab Specific Controls: View Toggle, Filters Drawer, New Task */}
        {activeTab === 'tasks' && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Live Presence Collaborators */}
            <PresenceAvatars />

            {/* Board / List View Toggle */}
            <div className="flex items-center bg-void p-1 rounded border border-steel">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === 'board'
                    ? 'bg-steel text-plasma'
                    : 'text-ash hover:text-bone'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === 'list'
                    ? 'bg-steel text-plasma'
                    : 'text-ash hover:text-bone'
                }`}
                title="Tabular List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Vaul Filters Drawer */}
            <TaskFilterDrawer
              filters={filters}
              onChange={setFilters}
              members={members}
            />

            {/* AI Standup Digest Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDigestOpen(true)}
              className="border-plasma/40 text-plasma hover:bg-plasma/10 font-hud text-xs tracking-wider min-h-[44px]"
              title="Stream executive standup brief generated by Mistral AI"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-plasma animate-pulse" />
              AI DIGEST
            </Button>

            {/* Create Task Button (Authoritative Permission Gated) */}
            {canCreateTask && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateSheetOpen(true)}
                className="min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-1.5" /> NEW TASK
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 3. Tab Content View */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <HeatSkeleton className="h-96 w-full" />
              <HeatSkeleton className="h-96 w-full" />
              <HeatSkeleton className="h-96 w-full" />
              <HeatSkeleton className="h-96 w-full" />
              <HeatSkeleton className="h-96 w-full" />
            </div>
          ) : viewMode === 'board' ? (
            <TaskBoard
              projectId={projectId}
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
            />
          ) : (
            <TaskListView
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
            />
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <ProjectTeamTab projectId={projectId} members={members} />
      )}

      {activeTab === 'activity' && <ProjectActivityTab projectId={projectId} />}

      {/* 4. Create Task Modal Sheet */}
      <CreateTaskSheet
        projectId={projectId}
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        members={members}
      />

      {/* 5. Project AI Standup Digest Telemetry Sheet */}
      <ProjectDigestSheet
        projectId={projectId}
        projectKey={project.key}
        projectName={project.name}
        open={digestOpen}
        onOpenChange={setDigestOpen}
      />

      {/* 6. Responsive Task Detail Drawer (Vaul on mobile / dialog on desktop) */}
      <Drawer.Root
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-basalt border-t border-steel rounded-t-xl z-50 p-6 outline-none overflow-y-auto">
            <div className="w-12 h-1.5 bg-steel rounded-full mx-auto mb-4" />
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="text-ash hover:text-bone p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedTask && (
              <TaskDetailContent
                taskId={selectedTask.id}
                onClose={() => setSelectedTask(null)}
              />
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
