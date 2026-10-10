'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskItem } from '@/lib/queries/use-tasks';
import { TaskStatus } from '@forgeline/shared';
import { TaskCard } from './task-card';

const LANE_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; border: string; bg: string }
> = {
  [TaskStatus.BACKLOG]: {
    label: 'BACKLOG',
    color: 'text-ash',
    border: 'border-steel',
    bg: 'bg-ash/10',
  },
  [TaskStatus.TODO]: {
    label: 'TODO',
    color: 'text-bone',
    border: 'border-steel',
    bg: 'bg-steel/30',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'IN PROGRESS',
    color: 'text-plasma',
    border: 'border-plasma/40',
    bg: 'bg-plasma/10',
  },
  [TaskStatus.IN_REVIEW]: {
    label: 'IN REVIEW',
    color: 'text-amber',
    border: 'border-amber/40',
    bg: 'bg-amber/10',
  },
  [TaskStatus.DONE]: {
    label: 'DONE',
    color: 'text-ice',
    border: 'border-ice/40',
    bg: 'bg-ice/10',
  },
};

export function TaskLane({
  status,
  tasks,
  onSelectTask,
}: {
  status: TaskStatus;
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const config = LANE_CONFIG[status];
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-w-[280px] w-[85vw] sm:w-[310px] flex-shrink-0 snap-center bg-graphite/40 border rounded transition-all duration-200 ${
        isOver
          ? 'border-plasma ring-1 ring-plasma/50 bg-plasma/5'
          : config.border
      }`}
    >
      {/* Lane Header */}
      <div className="p-3 border-b border-steel/60 flex items-center justify-between bg-basalt/80 rounded-t">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${config.bg} border ${config.border}`} />
          <h3 className={`font-hud uppercase tracking-wider text-xs font-bold ${config.color}`}>
            {config.label}
          </h3>
        </div>

        <span className="font-mono text-xs font-bold text-ash px-2 py-0.5 bg-steel/40 rounded">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Card Stack */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[300px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-24 border border-dashed border-steel/50 rounded flex items-center justify-center text-[10px] font-mono text-ash/60 uppercase">
            DROP TASKS HERE
          </div>
        )}
      </div>
    </div>
  );
}
