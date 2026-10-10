'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  useTask,
  useUpdateTask,
  TaskItem,
} from '@/lib/queries/use-tasks';
import {
  useTaskComments,
  useCreateComment,
  useDeleteComment,
} from '@/lib/queries/use-comments';
import { useProjectMembers } from '@/lib/queries/use-projects';
import { usePermissions } from '@/lib/permissions-hook';
import { useRecentEventsStore } from '@/lib/stores/recent-events-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import {
  TaskStatus,
  TaskPriority,
  Permissions,
} from '@forgeline/shared';
import {
  Calendar,
  MessageSquare,
  Send,
  Trash2,
  AtSign,
  ShieldAlert,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export function TaskDetailContent({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose?: () => void;
}) {
  const { data: task, isLoading: taskLoading, error } = useTask(taskId);
  const { data: comments = [], isLoading: commentsLoading } = useTaskComments(taskId);
  const { data: members = [] } = useProjectMembers(task?.projectId || '');

  const updateTask = useUpdateTask(taskId, task?.projectId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  // Comment input state & @mention autocomplete
  const [commentText, setCommentText] = useState('');
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Policy check
  const { can, user } = usePermissions(undefined, task?.projectId);
  const canUpdate = task
    ? can(Permissions.TASK_UPDATE, {
        projectId: task.projectId,
        assigneeId: task.assigneeId,
      })
    : false;

  // Handle comment input and mention trigger
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && !textBeforeCursor.slice(lastAt).includes(' ')) {
      setMentionFilter(textBeforeCursor.slice(lastAt + 1).toLowerCase());
      setMentionMenuOpen(true);
    } else {
      setMentionMenuOpen(false);
    }
  };

  const handleSelectMention = (member: (typeof members)[0]) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = commentText.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    const newText =
      commentText.slice(0, lastAt) +
      `@${member.user.handle} ` +
      commentText.slice(cursor);

    setCommentText(newText);
    setSelectedMentionIds((prev) => Array.from(new Set([...prev, member.userId])));
    setMentionMenuOpen(false);
    textareaRef.current.focus();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createComment.mutateAsync({
        body: commentText.trim(),
        mentions: selectedMentionIds,
      });
      setCommentText('');
      setSelectedMentionIds([]);
    } catch {
      // Handled by toast
    }
  };

  const isRecentlyModified = useRecentEventsStore((s) => s.isRecentlyModified(taskId));

  if (taskLoading) {
    return (
      <div className="p-6 space-y-4">
        <HeatSkeleton className="h-8 w-3/4" />
        <HeatSkeleton className="h-20 w-full" />
        <HeatSkeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!task || error) {
    return (
      <div className="p-8 text-center text-ash font-mono text-xs">
        TASK NOT FOUND OR PERMISSION RESTRICTED
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optional Back / Close Navigation Bar */}
      {onClose && (
        <div className="flex items-center justify-between pb-3 border-b border-steel/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-2.5 font-hud hover:border-plasma"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            BACK / CLOSE
          </Button>
          <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
            TASK WORKSPACE
          </span>
        </div>
      )}

      {/* Live Remote Update Alert Banner */}
      {isRecentlyModified && (
        <div className="p-3 bg-plasma/10 border border-plasma rounded flex items-center justify-between text-xs font-mono text-plasma animate-pulse">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-plasma" />
            <span>RECORD UPDATED REMOTELY BY COLLABORATOR (v{task.version})</span>
          </div>
          <span className="text-[10px] text-ash">LATEST REVISION ACTIVE</span>
        </div>
      )}

      {/* 1. Header with Task Number, Version Badge, and Status */}
      <div className="border-b border-steel/60 pb-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs text-plasma font-bold">
              {task.project?.key ? `[${task.project.key}-${task.number}]` : `#${task.number}`}
            </span>

            {/* Version Badge */}
            <span className="font-mono text-xs px-2 py-0.5 bg-steel/40 border border-steel text-bone font-bold rounded flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-plasma animate-pulse" />
              <span>v{task.version}</span>
            </span>
          </div>

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
          >
            {task.status.replace('_', ' ')}
          </Badge>
        </div>

        <h2 className="font-hud uppercase tracking-wider text-lg sm:text-xl font-bold text-bone">
          {task.title}
        </h2>
      </div>

      {/* 2. Metadata Attributes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-void/60 p-4 rounded border border-steel/50 text-xs font-mono">
        {/* Status selector */}
        <div>
          <span className="text-ash/70 block mb-1">WORKFLOW STATUS</span>
          <select
            value={task.status}
            disabled={!canUpdate || updateTask.isPending}
            onChange={(e) => {
              updateTask.mutate({
                data: { status: e.target.value as TaskStatus, version: task.version },
                ifMatch: task.version,
              });
            }}
            className="w-full bg-basalt border border-steel px-2.5 py-1.5 rounded text-bone focus:border-plasma outline-none min-h-[44px]"
          >
            {Object.values(TaskStatus).map((st) => (
              <option key={st} value={st}>
                {st.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Priority selector */}
        <div>
          <span className="text-ash/70 block mb-1">PRIORITY LEVEL</span>
          <select
            value={task.priority}
            disabled={!canUpdate || updateTask.isPending}
            onChange={(e) => {
              updateTask.mutate({
                data: { priority: e.target.value as TaskPriority, version: task.version },
                ifMatch: task.version,
              });
            }}
            className="w-full bg-basalt border border-steel px-2.5 py-1.5 rounded text-bone focus:border-plasma outline-none min-h-[44px]"
          >
            {Object.values(TaskPriority).map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee selector */}
        <div>
          <span className="text-ash/70 block mb-1">ASSIGNED AGENT</span>
          <select
            value={task.assigneeId || ''}
            disabled={!can(Permissions.TASK_ASSIGN) || updateTask.isPending}
            onChange={(e) => {
              updateTask.mutate({
                data: { assigneeId: e.target.value || null, version: task.version },
                ifMatch: task.version,
              });
            }}
            className="w-full bg-basalt border border-steel px-2.5 py-1.5 rounded text-bone focus:border-plasma outline-none min-h-[44px]"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name} (@{m.user.handle})
              </option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div>
          <span className="text-ash/70 block mb-1">DEADLINE</span>
          <div className="flex items-center space-x-2 text-bone py-2 px-1">
            <Calendar className="w-4 h-4 text-ember" />
            <span>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'No target deadline'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Description Specification */}
      <div className="space-y-1.5">
        <span className="font-mono text-xs uppercase text-ash tracking-wider">
          SPECIFICATION / BRIEF
        </span>
        <div className="p-3.5 bg-basalt border border-steel rounded text-sm text-bone font-body leading-relaxed whitespace-pre-wrap">
          {task.description || 'No detailed specifications entered for this work order.'}
        </div>
      </div>

      {/* 4. Comments & Mentions Thread */}
      <div className="space-y-3 pt-3 border-t border-steel/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-plasma" />
            <span className="font-hud uppercase tracking-wider text-xs font-bold text-bone">
              COMMENTS & TRANSMISSIONS ({comments.length})
            </span>
          </div>
          <span className="font-mono text-[10px] text-ash">@MENTIONS ENABLED</span>
        </div>

        {/* Comment Thread List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {commentsLoading ? (
            <HeatSkeleton className="h-16 w-full" />
          ) : comments.length === 0 ? (
            <div className="py-4 text-center text-xs font-mono text-ash/60 bg-void/50 border border-steel/40 rounded">
              NO TRANSMISSIONS LOGGED ON THIS RECORD
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete =
                comment.authorId === user?.id ||
                user?.globalRole === 'ADMIN' ||
                can(Permissions.COMMENT_DELETE);

              return (
                <div
                  key={comment.id}
                  className="p-3 bg-graphite/60 border border-steel/50 rounded space-y-1.5 text-xs font-body"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-plasma/20 border border-plasma/40 flex items-center justify-center text-[8px] font-bold text-plasma">
                        {comment.author.name.charAt(0)}
                      </div>
                      <span className="font-hud uppercase text-bone font-semibold">
                        {comment.author.name}
                      </span>
                      <span className="font-mono text-[10px] text-ash">
                        @{comment.author.handle}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[9px] text-ash/60">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {canDelete && (
                        <button
                          onClick={() => deleteComment.mutate(comment.id)}
                          className="text-ash hover:text-crimson p-0.5"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Body with @mention highlights */}
                  <div className="text-bone/90 pl-6 whitespace-pre-wrap leading-relaxed">
                    {comment.body.split(/(@\w+)/g).map((part, i) =>
                      part.startsWith('@') ? (
                        <span key={i} className="text-plasma font-mono font-bold bg-plasma/10 px-1 rounded">
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Composer with @mention Autocomplete */}
        <form onSubmit={handleSubmitComment} className="relative space-y-2 pt-2">
          {mentionMenuOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-basalt border border-plasma rounded shadow-xl max-h-40 overflow-y-auto z-50">
              <div className="px-2 py-1 text-[10px] font-mono text-ash uppercase border-b border-steel">
                SELECT PERSONNEL TO NOTIFY
              </div>
              {members
                .filter(
                  (m) =>
                    m.user.handle.toLowerCase().includes(mentionFilter) ||
                    m.user.name.toLowerCase().includes(mentionFilter),
                )
                .map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => handleSelectMention(m)}
                    className="w-full text-left px-3 py-1.5 hover:bg-steel/40 text-xs flex items-center justify-between"
                  >
                    <span className="text-bone font-hud">{m.user.name}</span>
                    <span className="font-mono text-plasma text-[10px]">@{m.user.handle}</span>
                  </button>
                ))}
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Post transmission... Use @handle to trigger instant alert"
              value={commentText}
              onChange={handleCommentChange}
              className="w-full bg-void border border-steel px-3 py-2 text-xs text-bone rounded focus:outline-none focus:border-plasma font-body placeholder:text-ash/50 resize-none pr-10"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!commentText.trim() || createComment.isPending}
              className="absolute right-2 bottom-2 h-7 w-7 p-0 flex items-center justify-center rounded"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>

      {/* Footer Close Button */}
      {onClose && (
        <div className="pt-4 border-t border-steel/60 flex items-center justify-between">
          <span className="font-mono text-[10px] text-ash">
            Concurrency Revision: v{task.version}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-hud"
          >
            DISMISS / CLOSE
          </Button>
        </div>
      )}
    </div>
  );
}
