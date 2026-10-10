'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { TaskItem, useMoveTask } from '@/lib/queries/use-tasks';
import { TaskStatus } from '@forgeline/shared';
import { TaskLane } from './task-lane';
import { TaskCard } from './task-card';

const BOARD_LANES: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

export function TaskBoard({
  projectId,
  tasks,
  onSelectTask,
}: {
  projectId: string;
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
}) {
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const moveTask = useMoveTask(projectId);

  // Touch-safe pointer sensor with activation constraints to avoid scroll collisions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    // Determine target status
    let targetStatus: TaskStatus | undefined;

    if (BOARD_LANES.includes(overId as TaskStatus)) {
      // Dropped directly on lane container
      targetStatus = overId as TaskStatus;
    } else {
      // Dropped on another card
      const targetCard = tasks.find((t) => t.id === overId);
      if (targetCard) {
        targetStatus = targetCard.status;
      }
    }

    if (!targetStatus) return;

    // Calculate new position within target lane
    const targetLaneTasks = tasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.position - b.position);

    let newPosition = 1000;
    const overIndex = targetLaneTasks.findIndex((t) => t.id === overId);

    if (overIndex === -1) {
      // Append to bottom
      const last = targetLaneTasks[targetLaneTasks.length - 1];
      newPosition = last ? last.position + 1000 : 1000;
    } else if (overIndex === 0) {
      // Insert at top
      newPosition = Math.max(10, Math.floor(targetLaneTasks[0].position / 2));
    } else {
      // Insert between
      const prev = targetLaneTasks[overIndex - 1];
      const next = targetLaneTasks[overIndex];
      newPosition = Math.floor((prev.position + next.position) / 2);
    }

    // Only mutate if status or position actually changed
    if (task.status !== targetStatus || Math.abs(task.position - newPosition) > 10) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // Ignore vibration failure
        }
      }

      moveTask.mutate({
        taskId: activeId,
        dto: {
          status: targetStatus,
          position: newPosition,
          version: task.version,
        },
        ifMatch: task.version,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Horizontal snap-scroll lane container on mobile; grid/flex layout on desktop */}
      <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 pt-1 gap-4 scroll-smooth min-h-[520px]">
        {BOARD_LANES.map((laneStatus) => {
          const laneTasks = tasks
            .filter((t) => t.status === laneStatus)
            .sort((a, b) => a.position - b.position);

          return (
            <TaskLane
              key={laneStatus}
              status={laneStatus}
              tasks={laneTasks}
              onSelectTask={onSelectTask}
            />
          );
        })}
      </div>

      {/* Drag overlay when moving a card */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
