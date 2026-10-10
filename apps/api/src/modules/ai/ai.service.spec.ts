import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GlobalRole, TaskPriority, TaskStatus } from '@forgeline/shared';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

describe('AiService', () => {
  let service: AiService;
  let prisma: any;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'dev@forgeline.dev',
    handle: 'dev',
    name: 'Dev Engineer',
    avatarSeed: 'seed',
    globalRole: GlobalRole.ADMIN,
    isActive: true,
    tokenVersion: 1,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    activityLog: {
      findMany: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.AI_ENABLED;
    delete process.env.Mistral_API_KEY;
    delete process.env.MISTRAL_API_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('When AI_ENABLED is false (Fallback Mode)', () => {
    it('should return deterministic task draft with aiGenerated: false', async () => {
      process.env.AI_ENABLED = 'false';

      const result = await service.generateTaskDraft(
        { prompt: 'Build notification webhook handler' },
        mockUser,
      );

      expect(result.aiGenerated).toBe(false);
      expect(result.draft.title).toBe('Build notification webhook handler');
      expect(result.draft.status).toBe(TaskStatus.BACKLOG);
      expect(result.draft.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should stream deterministic project digest via SSE when AI is disabled', async () => {
      process.env.AI_ENABLED = 'false';

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        name: 'Alpha Core',
        key: 'ALP',
        description: 'Core platform',
      });
      mockPrisma.task.findMany.mockResolvedValue([
        {
          number: 1,
          title: 'Initial setup',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          assignee: { name: 'Alice' },
          dueDate: null,
        },
        {
          number: 2,
          title: 'Implement WebSockets',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.URGENT,
          assignee: { name: 'Bob' },
          dueDate: null,
        },
      ]);
      mockPrisma.activityLog.findMany.mockResolvedValue([]);

      const writtenChunks: string[] = [];
      const mockRes: any = {
        setHeader: jest.fn(),
        write: jest.fn((chunk: string) => writtenChunks.push(chunk)),
        end: jest.fn(),
        flushHeaders: jest.fn(),
      };

      await service.generateProjectDigest('proj-1', mockUser, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(writtenChunks.length).toBeGreaterThan(0);
      expect(mockRes.end).toHaveBeenCalled();

      const combinedText = writtenChunks.join('');
      expect(combinedText).toContain('[FORGELINE STANDUP DIGEST]');
      expect(combinedText).toContain('data: [DONE]');
    });
  });

  describe('When AI_ENABLED is true with Mocked Mistral HTTP Call', () => {
    it('should parse structured JSON from Mistral chat completions and return validated draft', async () => {
      process.env.AI_ENABLED = 'true';
      process.env.Mistral_API_KEY = 'mock-key';

      const mockAiPayload = {
        title: 'Optimize Database Query Indexes',
        description: 'Add composite indexes on tasks (projectId, status, version) for fast board loads.',
        priority: 'HIGH',
        status: 'TODO',
      };

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAiPayload),
              },
            },
          ],
        }),
      } as any);

      try {
        const result = await service.generateTaskDraft(
          { prompt: 'Optimize tasks table indexes for high concurrency' },
          mockUser,
        );

        expect(result.aiGenerated).toBe(true);
        expect(result.draft.title).toBe('Optimize Database Query Indexes');
        expect(result.draft.priority).toBe(TaskPriority.HIGH);
        expect(result.draft.status).toBe(TaskStatus.TODO);
        expect(global.fetch).toHaveBeenCalledTimes(1);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle 429 rate limit backoff and retry successfully', async () => {
      process.env.AI_ENABLED = 'true';
      process.env.Mistral_API_KEY = 'mock-key';

      const mockAiPayload = {
        title: 'Resilient Task',
        description: 'Completed after retry',
        priority: 'MEDIUM',
        status: 'BACKLOG',
      };

      const originalFetch = global.fetch;
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(mockAiPayload) } }],
          }),
        };
      });

      try {
        const result = await service.generateTaskDraft(
          { prompt: 'Test rate limit resilience' },
          mockUser,
        );

        expect(callCount).toBe(2);
        expect(result.aiGenerated).toBe(true);
        expect(result.draft.title).toBe('Resilient Task');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
