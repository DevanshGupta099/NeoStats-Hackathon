'use client';

import React from 'react';
import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from '@/lib/queries/use-tasks';
import { Badge } from '@/components/ui/badge';
import { TaskPriority, TaskStatus } from '@forgeline/shared';
import { Calendar, MessageSquare, GripVertical } from 'lucide-react';

import { useRecentEventsStore } from '@/lib/stores/recent-events-store';

export function TaskCard({
  task,
  onSelect,
  isDragOverlay = false,
}: {
  task: TaskItem;
  onSelect?: (task: TaskItem) => void;
  isDragOverlay?: boolean;
}) {
  const isRecentlyModified = useRecentEventsStore((s) => s.isRecentlyModified(task.id));

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priorityVariant =
    task.priority === TaskPriority.URGENT || task.priority === TaskPriority.HIGH
      ? 'ember'
      : 'default';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`hud-panel p-3.5 bg-basalt border-steel rounded transition-all select-none ${
        isDragOverlay
          ? 'shadow-2xl border-plasma scale-105 z-50 ring-2 ring-plasma/50'
          : isRecentlyModified
          ? 'ring-2 ring-ice border-ice shadow-[0_0_16px_rgba(92,225,230,0.6)] animate-pulse'
          : 'hover:border-steel/80 active:border-plasma/60'
      }`}
    >
      {/* Header: ID, Version, Priority, Drag Handle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="font-mono text-xs font-bold text-plasma">
            #{task.number}
          </span>
          <span className="font-mono text-[9px] text-ash/80 bg-steel/30 px-1 py-0.2 rounded">
            v{task.version}
          </span>
          <Badge variant={priorityVariant} className="text-[9px] px-1.5 py-0">
            {task.priority}
          </Badge>
        </div>

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-ash hover:text-bone cursor-grab active:cursor-grabbing touch-none min-h-[32px] min-w-[32px] flex items-center justify-center -mr-1"
          aria-label="Drag task"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task Title */}
      <h4
        onClick={() => onSelect?.(task)}
        className="font-hud uppercase tracking-wide text-xs font-semibold text-bone hover:text-plasma cursor-pointer transition-colors line-clamp-2 mb-2"
      >
        {task.title}
      </h4>

      {/* Footer: Assignee, Due Date, Comments */}
      <div className="flex items-center justify-between pt-2 border-t border-steel/40 text-[10px] font-mono text-ash">
        {/* Assignee Avatar / Name */}
        <div className="flex items-center space-x-1.5 truncate max-w-[120px]">
          {task.assignee ? (
            <>
              <div className="w-4 h-4 rounded-full bg-plasma/20 border border-plasma/50 flex items-center justify-center text-[8px] font-bold text-plasma flex-shrink-0">
                {task.assignee.name.charAt(0)}
              </div>
              <span className="truncate text-bone">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-ash/60 italic">Unassigned</span>
          )}
        </div>

        {/* Metadata: Due Date & Comments */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {(task.commentCount ?? 0) > 0 && (
            <div className="flex items-center space-x-0.5 text-ash">
              <MessageSquare className="w-3 h-3" />
              <span>{task.commentCount}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center space-x-0.5 text-ash">
              <Calendar className="w-3 h-3 text-ember" />
              <span>
                {new Date(task.dueDate).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
