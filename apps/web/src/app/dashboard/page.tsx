'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useMyTasks } from '@/lib/queries/use-tasks';
import { useUnreadNotificationCount } from '@/lib/queries/use-notifications';
import { useHeatStore } from '@/lib/stores/heat-store';
import { StatTotems } from '@/components/canvas/stat-totems';
import { ActivityTicker } from '@/components/dashboard/activity-ticker';
import { ForgeText } from '@/components/canvas/forge-text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskStatus, TaskPriority } from '@forgeline/shared';
import {
  ArrowRight,
  FolderGit2,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: myTasks = [], isLoading: tasksLoading } = useMyTasks();
  const { data: unreadData } = useUnreadNotificationCount();
  const setInProgressCount = useHeatStore((s) => s.setInProgressCount);

  // Compute metrics for StatTotems and HeatField
  const { openCount, dueSoonCount, inReviewCount, inProgressCount } = useMemo(() => {
    let open = 0;
    let dueSoon = 0;
    let inReview = 0;
    let inProgress = 0;

    const now = Date.now();
    const threshold48h = now + 48 * 3600 * 1000;

    myTasks.forEach((task) => {
      if (task.status !== TaskStatus.DONE) {
        open++;
      }
      if (task.status === TaskStatus.IN_REVIEW) {
        inReview++;
      }
      if (task.status === TaskStatus.IN_PROGRESS) {
        inProgress++;
      }
      if (task.dueDate && task.status !== TaskStatus.DONE) {
        const dueTime = new Date(task.dueDate).getTime();
        if (dueTime <= threshold48h && dueTime >= now - 86400000) {
          dueSoon++;
        }
      }
    });

    return {
      openCount: open,
      dueSoonCount: dueSoon,
      inReviewCount: inReview,
      inProgressCount: inProgress,
    };
  }, [myTasks]);

  // Drive HeatField shader intensity dynamically based on in-progress count
  useEffect(() => {
    setInProgressCount(inProgressCount);
  }, [inProgressCount, setInProgressCount]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Hero Banner with ForgeText */}
      <div className="hud-panel p-5 sm:p-7 hud-corner-brackets bg-basalt/85 border-steel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-plasma animate-ping" />
              <span className="font-mono text-[10px] text-plasma tracking-widest uppercase">
                // OPERATIONS CONSOLE [SYS_NODE: {user?.handle?.toUpperCase() || 'AGENT'}]
              </span>
            </div>

            <div className="h-14 sm:h-16 flex items-center">
              <ForgeText fontSize={1.2} className="w-full">
                OPERATIONS FORGE
              </ForgeText>
            </div>

            <p className="font-body text-xs sm:text-sm text-ash mt-1">
              Active terminal for <span className="text-bone font-medium">{user?.name}</span> (
              <span className="text-plasma font-mono">{user?.globalRole}</span>). Core telemetry online.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/projects">
              <Button variant="primary" size="md" className="min-h-[44px]">
                ACCESS PROJECTS <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. StatTotems WebGL 3D Pillars & Counters */}
      <StatTotems
        openTasks={openCount}
        dueSoon={dueSoonCount}
        inReview={inReviewCount}
        unreadNotifications={unreadData?.count ?? 0}
      />

      {/* 3. Operational Grid: My Tasks & Event Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-steel/60 pb-2">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-plasma" />
              <h3 className="font-hud uppercase tracking-wider text-sm font-bold text-bone">
                ASSIGNED TO ME ({myTasks.length})
              </h3>
            </div>
            <span className="font-mono text-[10px] text-ash">GET /tasks/mine</span>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              <HeatSkeleton className="h-20 w-full" />
              <HeatSkeleton className="h-20 w-full" />
              <HeatSkeleton className="h-20 w-full" />
            </div>
          ) : myTasks.length === 0 ? (
            <EmptyState
              title="NO PENDING TASKS ASSIGNED"
              description="Your workload backlog is clear. Browse projects to inspect team sprints."
            />
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="hud-panel p-4 bg-basalt border-steel hover:border-plasma/60 transition-all block group rounded min-h-[44px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono text-xs text-plasma font-bold">
                          {task.project?.key ? `[${task.project.key}-${task.number}]` : `#${task.number}`}
                        </span>

                        <Badge
                          variant={
                            task.status === TaskStatus.DONE
                              ? 'ice'
                              : task.status === TaskStatus.IN_PROGRESS
                              ? 'plasma'
                              : task.status === TaskStatus.IN_REVIEW
                              ? 'amber'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>

                        <Badge
                          variant={
                            task.priority === TaskPriority.URGENT || task.priority === TaskPriority.HIGH
                              ? 'ember'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {task.priority}
                        </Badge>

                        <span className="font-mono text-[10px] text-ash/80 bg-steel/30 px-1.5 py-0.5 rounded">
                          v{task.version}
                        </span>
                      </div>

                      <h4 className="font-hud uppercase tracking-wide text-sm font-semibold text-bone group-hover:text-plasma transition-colors truncate">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="font-body text-xs text-ash line-clamp-1">{task.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 text-right">
                      {task.dueDate && (
                        <div className="flex items-center space-x-1 text-ash text-[10px] font-mono">
                          <Calendar className="w-3 h-3 text-ember" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-ash group-hover:text-plasma group-hover:translate-x-1 transition-all mt-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Activity Ticker */}
        <div className="space-y-4">
          <ActivityTicker />

          {/* Quick Shortcuts Widget */}
          <div className="hud-panel p-4 bg-basalt border-steel space-y-3">
            <span className="font-mono text-[10px] text-ash tracking-widest uppercase block border-b border-steel/60 pb-2">
              // TELEMETRY ROUTING
            </span>
            <div className="space-y-2">
              <Link href="/projects" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start min-h-[44px]">
                  <FolderGit2 className="w-4 h-4 mr-2 text-plasma" />
                  WORKSPACE DIRECTORY
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
