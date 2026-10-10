import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  GlobalRole,
  TaskDraftRequestInput,
  TaskDraftResponseSchema,
  AiTaskDraftEnvelope,
  TaskPriority,
  TaskStatus,
} from '@forgeline/shared';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  public isAiEnabled(): boolean {
    const flag = process.env.AI_ENABLED;
    const isExplicitlyTrue = flag === 'true' || flag === '1';
    const hasKey = !!this.getApiKey();
    return isExplicitlyTrue && hasKey;
  }

  private getApiKey(): string | undefined {
    return process.env.Mistral_API_KEY || process.env.MISTRAL_API_KEY;
  }

  private getModel(): string {
    return process.env.MISTRAL_MODEL || 'mistral-small-latest';
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 2,
  ): Promise<globalThis.Response> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const res = await fetch(url, options);
        if (res.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
          this.logger.warn(`Mistral 429 rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        return res;
      } catch (err: any) {
        if (attempt < maxRetries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Mistral request failed after max retries');
  }

  async generateProjectDigest(
    projectId: string,
    user: AuthenticatedUser,
    res: ExpressResponse,
  ): Promise<void> {
    // 1. Ensure project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, key: true, description: true },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Project not found',
      });
    }

    // 2. Fetch scoped tasks and activity logs (never sensitive info)
    const [tasks, activities] = await Promise.all([
      this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        orderBy: [{ updatedAt: 'desc' }],
        take: 25,
        select: {
          number: true,
          title: true,
          status: true,
          priority: true,
          assignee: { select: { name: true } },
          dueDate: true,
        },
      }),
      this.prisma.activityLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          action: true,
          entityType: true,
          entityId: true,
          actor: { select: { name: true } },
          createdAt: true,
        },
      }),
    ]);

    // 3. Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const totalTasks = tasks.length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const highPriority = tasks.filter(
      (t) => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT,
    ).length;

    // Helper to send SSE event
    const sendSse = (data: Record<string, any> | string) => {
      if (typeof data === 'string') {
        res.write(`data: ${data}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    // 4. Fallback if AI disabled or key absent
    if (!this.isAiEnabled()) {
      const fallbackReport = [
        `### [FORGELINE STANDUP DIGEST] // PROJECT: ${project.key}\n\n`,
        `> **ENGINE STATUS:** Rule-based fallback active (AI_ENABLED=false).\n\n`,
        `#### 1. Operations Overview\n`,
        `- **Active Pipeline:** ${totalTasks} total tasks logged\n`,
        `- **Completed Deliverables:** ${done} tasks closed\n`,
        `- **Active In Flight:** ${inProgress} tasks in progress\n`,
        `- **High-Priority Attention:** ${highPriority} tasks flagged HIGH or URGENT\n\n`,
        `#### 2. Active Focus Items\n`,
        tasks
          .filter((t) => t.status === TaskStatus.IN_PROGRESS)
          .slice(0, 5)
          .map((t) => `- \`[${project.key}-${t.number}]\` **${t.title}** (${t.assignee?.name || 'Unassigned'})`)
          .join('\n') || '- None currently in progress',
        `\n\n#### 3. Recent Project Telemetry\n`,
        activities
          .slice(0, 5)
          .map((a) => `- ${a.actor.name}: ${a.action} on ${a.entityType}`)
          .join('\n') || '- No recent activity logs recorded',
        `\n\n*Standup summary synthesized successfully.*`,
      ].join('');

      // Stream fallback text in smooth chunks
      const chunks = fallbackReport.split('\n');
      for (const line of chunks) {
        sendSse({ text: line + '\n', aiGenerated: false });
        await new Promise((r) => setTimeout(r, 20));
      }
      sendSse('[DONE]');
      res.end();
      return;
    }

    // 5. Live Mistral streaming call
    const apiKey = this.getApiKey();
    const systemPrompt = `You are Forgeline Autonomous Operations AI. You produce punchy, industrial, brutalist executive project standup digests.
Format cleanly with Markdown:
- **Operations Velocity & Status**
- **Critical Focus & Blockers**
- **Immediate Recommended Actions**
Be strictly technical, precise, and concise. Do not hallucinate tasks not provided. Keep response under 250 words.`;

    const userPrompt = `PROJECT: ${project.name} (${project.key})
DESCRIPTION: ${project.description || 'N/A'}

TASKS (${tasks.length} total):
${tasks
  .map(
    (t) =>
      `- [${project.key}-${t.number}] (${t.status}, priority ${t.priority}) "${t.title}" -> Assignee: ${t.assignee?.name || 'Unassigned'}`,
  )
  .join('\n')}

RECENT ACTIVITY (${activities.length} entries):
${activities.map((a) => `- ${a.actor.name} ${a.action} ${a.entityType}`).join('\n')}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await this.fetchWithRetry(
        'https://api.mistral.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.getModel(),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            max_tokens: 1000,
            temperature: 0.2,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Mistral API responded with status ${(response as any).status}`);
      }

      // Stream chunks from Mistral to client
      const body = (response as any).body;
      if (!body) {
        throw new Error('No response body returned from Mistral');
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              sendSse({ text: content, aiGenerated: true });
            }
          } catch {
            // Ignore partial SSE framing
          }
        }
      }

      sendSse('[DONE]');
      res.end();
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.error(`Error streaming from Mistral: ${err.message}`, err.stack);
      // Fallback message so user never gets broken connection
      sendSse({
        text: `\n\n> [!WARNING]\n> Standup stream interrupted. Live AI gateway timed out or hit rate limit. Fallback generated.\n\nActive pipeline has ${totalTasks} tasks (${inProgress} in progress, ${highPriority} urgent).`,
        aiGenerated: false,
      });
      sendSse('[DONE]');
      res.end();
    }
  }

  async generateTaskDraft(
    dto: TaskDraftRequestInput,
    user: AuthenticatedUser,
  ): Promise<AiTaskDraftEnvelope> {
    // 1. Scoping verification if projectId provided
    if (dto.projectId && user.globalRole !== GlobalRole.ADMIN) {
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: dto.projectId,
            userId: user.id,
          },
        },
      });
      if (!member) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You are not a member of this project',
        });
      }
    }

    // 2. Fallback if AI disabled or key missing
    if (!this.isAiEnabled()) {
      const sanitizedTitle = dto.prompt.replace(/[\r\n]+/g, ' ').slice(0, 80).trim();
      return {
        draft: {
          title: sanitizedTitle || 'New Draft Task',
          description: dto.prompt,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.BACKLOG,
        },
        aiGenerated: false,
        note: 'AI features are disabled on this instance (AI_ENABLED=false). Deterministic template drafted.',
      };
    }

    // 3. Live Mistral task draft call
    const apiKey = this.getApiKey();
    const systemPrompt = `You are Forgeline AI. Analyze the user prompt and generate a structured task payload.
Respond ONLY with a valid JSON object matching this schema:
{
  "title": string (concise, action-oriented, max 80 chars),
  "description": string (technical details and acceptance criteria in markdown),
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "status": "BACKLOG" | "TODO" | "IN_PROGRESS"
}
Do not include any explanations, greetings, or markdown code fences outside the JSON.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await this.fetchWithRetry(
        'https://api.mistral.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.getModel(),
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: dto.prompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
            temperature: 0.1,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Mistral API responded with status ${(response as any).status}`);
      }

      const data = (await (response as any).json()) as any;
      const rawContent = data.choices?.[0]?.message?.content || '{}';
      const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

      const parsed = JSON.parse(cleanJson);
      const validated = TaskDraftResponseSchema.safeParse(parsed);

      if (validated.success) {
        return {
          draft: validated.data,
          aiGenerated: true,
        };
      }

      // If schema validation failed, fallback with extracted text
      return {
        draft: {
          title: (parsed.title || dto.prompt.slice(0, 80)).trim(),
          description: parsed.description || dto.prompt,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.BACKLOG,
        },
        aiGenerated: true,
        note: 'AI output adjusted to comply with system schema.',
      };
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.warn(`Task draft AI fallback used: ${err.message}`);
      return {
        draft: {
          title: dto.prompt.slice(0, 80).trim() || 'New Draft Task',
          description: dto.prompt,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.BACKLOG,
        },
        aiGenerated: false,
        note: 'AI gateway connection failed or timed out; deterministic fallback provided.',
      };
    }
  }
}
