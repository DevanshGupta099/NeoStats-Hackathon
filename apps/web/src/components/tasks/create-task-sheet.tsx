'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaskSchema, CreateTaskInput, TaskPriority, TaskStatus } from '@forgeline/shared';
import { useCreateTask } from '@/lib/queries/use-tasks';
import { ProjectMember } from '@/lib/queries/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';

interface CreateTaskSheetProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ProjectMember[];
}

interface CreateTaskFormValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  position?: number;
}

export function CreateTaskSheet({
  projectId,
  open,
  onOpenChange,
  members,
}: CreateTaskSheetProps) {
  const createTask = useCreateTask(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(CreateTaskSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      dueDate: null,
      position: 1000,
    },
  });

  const onSubmit = async (data: CreateTaskFormValues) => {
    try {
      await createTask.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        position: data.position ?? 1000,
      });
      reset();
      onOpenChange(false);
    } catch {
      // Handled by mutation onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-plasma mb-1">
            <PlusCircle className="w-5 h-5" />
            <span className="font-mono text-[10px] tracking-widest uppercase">
              // TASK ALLOCATION
            </span>
          </div>
          <DialogTitle>ENQUEUE NEW WORKLOAD</DialogTitle>
          <DialogDescription>
            Register work order with race-safe contiguous project task numbering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Task Title *
            </label>
            <Input
              placeholder="e.g. Implement Optimistic Locking Handler"
              {...register('title')}
              className={errors.title ? 'border-crimson' : ''}
            />
            {errors.title && (
              <p className="text-crimson text-[10px] font-mono mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Specification & Details
            </label>
            <textarea
              rows={3}
              placeholder="Acceptance criteria, constraints, and architecture notes..."
              {...register('description')}
              className="w-full bg-void border border-steel px-3 py-2 text-sm text-bone rounded focus:outline-none focus:border-plasma font-body placeholder:text-ash/50 resize-none"
            />
            {errors.description && (
              <p className="text-crimson text-[10px] font-mono mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">
                Initial Status
              </label>
              <select
                {...register('status')}
                className="w-full bg-void border border-steel px-3 py-2 text-xs font-mono text-bone rounded focus:border-plasma outline-none min-h-[44px]"
              >
                {Object.values(TaskStatus).map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full bg-void border border-steel px-3 py-2 text-xs font-mono text-bone rounded focus:border-plasma outline-none min-h-[44px]"
              >
                {Object.values(TaskPriority).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Assigned Personnel
            </label>
            <select
              {...register('assigneeId')}
              className="w-full bg-void border border-steel px-3 py-2 text-xs font-mono text-bone rounded focus:border-plasma outline-none min-h-[44px]"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} (@{m.user.handle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Target Deadline (Optional)
            </label>
            <Input type="datetime-local" {...register('dueDate')} />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-steel/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || createTask.isPending}
            >
              {createTask.isPending ? 'COMMITTING...' : 'DISPATCH TASK'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
