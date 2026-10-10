'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { TaskFilters } from '@/lib/queries/use-tasks';
import { TaskPriority, TaskStatus } from '@forgeline/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, X, RotateCcw } from 'lucide-react';
import { ProjectMember } from '@/lib/queries/use-projects';

interface TaskFilterDrawerProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  members: ProjectMember[];
}

export function TaskFilterDrawer({ filters, onChange, members }: TaskFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);

  const activeFilterCount =
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.assigneeId ? 1 : 0) +
    (filters.search ? 1 : 0);

  const handleReset = () => {
    onChange({});
    setOpen(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm" className="relative min-h-[44px]">
          <Filter className="w-3.5 h-3.5 mr-1.5 text-plasma" />
          FILTERS
          {activeFilterCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-plasma text-void text-[10px] font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-basalt border-t border-steel rounded-t-xl z-50 p-5 outline-none flex flex-col">
          {/* Grab handle */}
          <div className="w-12 h-1.5 bg-steel rounded-full mx-auto mb-4" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-steel/60">
            <div>
              <h3 className="font-hud uppercase tracking-wider text-base font-bold text-bone">
                WORKLOAD TELEMETRY FILTERS
              </h3>
              <p className="font-body text-xs text-ash">
                Filter active sprint tasks across state, priority, and personnel.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-ash hover:text-bone min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Form Controls */}
          <div className="py-4 space-y-4 overflow-y-auto flex-1">
            {/* Search */}
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">
                Search Term
              </label>
              <Input
                placeholder="Title or description keyword..."
                value={filters.search || ''}
                onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1.5">
                Lifecycle Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(TaskStatus).map((st) => (
                  <button
                    key={st}
                    onClick={() =>
                      onChange({
                        ...filters,
                        status: filters.status === st ? undefined : st,
                      })
                    }
                    className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors min-h-[36px] ${
                      filters.status === st
                        ? 'bg-plasma text-void font-bold'
                        : 'bg-void border border-steel text-ash hover:text-bone'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1.5">
                Urgency Priority
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(TaskPriority).map((pr) => (
                  <button
                    key={pr}
                    onClick={() =>
                      onChange({
                        ...filters,
                        priority: filters.priority === pr ? undefined : pr,
                      })
                    }
                    className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors min-h-[36px] ${
                      filters.priority === pr
                        ? 'bg-ember text-void font-bold'
                        : 'bg-void border border-steel text-ash hover:text-bone'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1.5">
                Assigned Personnel
              </label>
              <select
                value={filters.assigneeId || ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    assigneeId: e.target.value || undefined,
                  })
                }
                className="w-full bg-void border border-steel px-3 py-2 text-sm text-bone rounded font-mono focus:border-plasma outline-none min-h-[44px]"
              >
                <option value="">All Team Personnel</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} (@{m.user.handle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-steel/60 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> RESET
            </Button>
            <Button variant="primary" size="sm" onClick={() => setOpen(false)}>
              APPLY FILTERS
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
