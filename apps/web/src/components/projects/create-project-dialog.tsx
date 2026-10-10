'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema, CreateProjectInput } from '@forgeline/shared';
import { useCreateProject } from '@/lib/queries/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      await createProject.mutateAsync({
        name: data.name,
        key: data.key.toUpperCase(),
        description: data.description || undefined,
      });
      reset();
      onOpenChange(false);
    } catch {
      // Error handled by mutation onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center space-x-2 text-plasma mb-1">
            <FolderPlus className="w-5 h-5" />
            <span className="font-mono text-[11px] tracking-wider uppercase font-semibold">
              PROJECT MANAGEMENT
            </span>
          </div>
          <DialogTitle>CREATE NEW PROJECT</DialogTitle>
          <DialogDescription>
            Set up a collaborative project workspace with version sequencing and team access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Project Name *
            </label>
            <Input
              placeholder="e.g. Core Engine Infrastructure"
              {...register('name')}
              className={errors.name ? 'border-crimson' : ''}
            />
            {errors.name && (
              <p className="text-crimson text-[10px] font-mono mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Project Key (2-10 chars, uppercase alphanumeric) *
            </label>
            <Input
              placeholder="e.g. ENG"
              {...register('key')}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
              className={errors.key ? 'border-crimson' : ''}
            />
            {errors.key && (
              <p className="text-crimson text-[10px] font-mono mt-1">{errors.key.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ash mb-1">
              Project Description
            </label>
            <textarea
              rows={3}
              placeholder="Operational objectives and sprint deliverables..."
              {...register('description')}
              className="w-full bg-void border border-steel px-3 py-2 text-sm text-bone rounded focus:outline-none focus:border-plasma font-body placeholder:text-ash/50 resize-none"
            />
            {errors.description && (
              <p className="text-crimson text-[10px] font-mono mt-1">{errors.description.message}</p>
            )}
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
              disabled={isSubmitting || createProject.isPending}
            >
              {createProject.isPending ? 'CREATING...' : 'CREATE PROJECT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
