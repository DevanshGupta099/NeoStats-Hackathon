'use client';

import React, { useState } from 'react';
import { ProjectMember } from '@/lib/queries/use-projects';
import { usePermissions } from '@/lib/permissions-hook';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/queries/keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectRole, Permissions } from '@forgeline/shared';
import { UserPlus, Trash2, Calendar, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectTeamTab({
  projectId,
  members,
}: {
  projectId: string;
  members: ProjectMember[];
}) {
  const { can, user: currentUser } = usePermissions(undefined, projectId);
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<ProjectRole>(ProjectRole.MEMBER);

  const canManageMembers = can(Permissions.PROJECT_MANAGE_MEMBERS);

  // Add member mutation
  const addMember = useMutation({
    mutationFn: (data: { userId: string; projectRole: ProjectRole }) =>
      apiClient.post(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      toast.success('MEMBER ONBOARDED', { description: 'Collaborator added to project roster.' });
      setAddDialogOpen(false);
      setNewUserId('');
    },
  });

  // Change role mutation
  const updateRole = useMutation({
    mutationFn: ({ userId, projectRole }: { userId: string; projectRole: ProjectRole }) =>
      apiClient.patch(`/projects/${projectId}/members/${userId}`, { projectRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      toast.success('ROLE ADJUSTED', { description: 'Member permissions updated.' });
    },
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      toast.success('MEMBER EXPUNGED', { description: 'Collaborator removed from roster.' });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    addMember.mutate({ userId: newUserId.trim(), projectRole: newRole });
  };

  return (
    <div className="space-y-6">
      {/* Top Roster Header & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-hud uppercase tracking-wider text-sm font-bold text-bone">
            ROSTER PERSONNEL ({members.length})
          </h3>
          <p className="font-body text-xs text-ash">
            Collaborators with assigned authorization clearance for this workspace sector.
          </p>
        </div>

        {canManageMembers && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="min-h-[44px]"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> ADD COLLABORATOR
          </Button>
        )}
      </div>

      {/* Roster Plates */}
      {members.length === 0 ? (
        <div className="hud-panel p-8 text-center bg-basalt border-steel border-dashed rounded text-xs font-mono text-ash">
          NO ROSTER ROLES CURRENTLY ASSIGNED
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const isManager = m.projectRole === ProjectRole.MANAGER;
            const isMember = m.projectRole === ProjectRole.MEMBER;
            const isSelf = m.userId === currentUser?.id;

            return (
              <div
                key={m.userId}
                className={`hud-panel p-4 bg-basalt border rounded flex flex-col justify-between space-y-3 transition-colors ${
                  isManager
                    ? 'border-l-4 border-l-plasma border-steel'
                    : isMember
                    ? 'border-l-4 border-l-ice border-steel'
                    : 'border-l-4 border-l-ash border-steel'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded bg-graphite border border-steel flex items-center justify-center font-hud text-base font-bold text-bone flex-shrink-0">
                    {m.user.name.charAt(0)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-hud uppercase tracking-wide text-xs font-bold text-bone truncate">
                        {m.user.name}
                      </h4>
                      <Badge
                        variant={isManager ? 'plasma' : isMember ? 'ice' : 'default'}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {m.projectRole}
                      </Badge>
                    </div>

                    <span className="font-mono text-[10px] text-ash block truncate">
                      @{m.user.handle} &bull; {m.user.email}
                    </span>

                    <div className="flex items-center space-x-1 text-[9px] font-mono text-ash/60 pt-1 border-t border-steel/40">
                      <Calendar className="w-3 h-3 text-steel" />
                      <span>Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Management controls for PM / Admin */}
                {canManageMembers && !isSelf && (
                  <div className="pt-2 border-t border-steel/60 flex items-center justify-between gap-2">
                    <select
                      value={m.projectRole}
                      disabled={updateRole.isPending}
                      onChange={(e) =>
                        updateRole.mutate({
                          userId: m.userId,
                          projectRole: e.target.value as ProjectRole,
                        })
                      }
                      className="bg-void border border-steel px-2 py-1 text-[10px] font-mono text-bone rounded outline-none focus:border-plasma"
                    >
                      {Object.values(ProjectRole).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeMember.mutate(m.userId)}
                      disabled={removeMember.isPending}
                      className="p-1.5 text-ash hover:text-crimson hover:bg-crimson/10 rounded transition-colors"
                      title="Remove from project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ENROLL PROJECT COLLABORATOR</DialogTitle>
            <DialogDescription>
              Assign user clearance level to participate in sprint workflows.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">
                Collaborator User ID (UUID) *
              </label>
              <Input
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-ash mb-1">
                Project Clearance Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as ProjectRole)}
                className="w-full bg-void border border-steel px-3 py-2 text-xs font-mono text-bone rounded outline-none focus:border-plasma min-h-[44px]"
              >
                {Object.values(ProjectRole).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-steel/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(false)}
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newUserId.trim() || addMember.isPending}
              >
                {addMember.isPending ? 'ENROLLING...' : 'ENROLL MEMBER'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
