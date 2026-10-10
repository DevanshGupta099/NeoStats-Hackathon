'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskDetailContent } from '@/components/tasks/task-detail-content';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = String(params.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          RETURN TO SPRINT
        </Button>
      </div>

      {/* Main Task Detail Pane */}
      <div className="hud-panel p-6 sm:p-8 bg-basalt border-steel hud-corner-brackets">
        <TaskDetailContent taskId={taskId} onClose={() => router.back()} />
      </div>
    </div>
  );
}
