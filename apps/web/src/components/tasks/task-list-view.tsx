'use client';

import React from 'react';
import { TaskItem } from '@/lib/queries/use-tasks';
import { Badge } from '@/components/ui/badge';
import { TaskPriority, TaskStatus } from '@forgeline/shared';
import { Calendar, MessageSquare, ArrowRight } from 'lucide-react';

export function TaskListView({
  tasks,
  onSelectTask,
}: {
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="hud-panel p-8 text-center bg-basalt border-steel border-dashed rounded text-xs font-mono text-ash">
        NO WORKLOADS FOUND MATCHING ACTIVE FILTER CRITERIA
      </div>
    );
  }

  return (
    <div className="hud-panel bg-basalt border-steel rounded overflow-hidden">
      <div className="divide-y divide-steel/50">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onSelectTask?.(task)}
            className="p-3.5 sm:p-4 hover:bg-graphite/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group min-h-[44px]"
          >
            {/* Title & Key */}
            <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
              <span className="font-mono text-xs font-bold text-plasma flex-shrink-0">
                #{task.number}
              </span>

              <div className="min-w-0 flex-1">
                <h4 className="font-hud uppercase tracking-wide text-xs sm:text-sm font-semibold text-bone group-hover:text-plasma transition-colors truncate">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="font-body text-xs text-ash line-clamp-1 hidden sm:block">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* Badges & Meta */}
            <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap justify-between sm:justify-end text-xs font-mono">
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

              {/* Assignee */}
              <div className="flex items-center space-x-1.5 text-ash text-[10px] truncate max-w-[100px]">
                {task.assignee ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-steel flex items-center justify-center text-[8px] text-bone font-bold">
                      {task.assignee.name.charAt(0)}
                    </div>
                    <span className="truncate text-bone">{task.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-ash/50 italic">None</span>
                )}
              </div>

              {/* Due date */}
              {task.dueDate && (
                <div className="flex items-center space-x-1 text-ash text-[10px]">
                  <Calendar className="w-3 h-3 text-ember" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              <span className="font-mono text-[9px] text-ash/70 bg-steel/30 px-1 py-0.5 rounded">
                v{task.version}
              </span>

              <ArrowRight className="w-3.5 h-3.5 text-ash group-hover:text-plasma group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
