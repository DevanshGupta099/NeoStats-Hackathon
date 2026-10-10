import { PrismaClient, GlobalRole, ProjectRole, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting idempotent database seed...');

  // 1. Password hashing with Argon2id
  const sharedPassword = 'Forge@12345';
  const passwordHash = await argon2.hash(sharedPassword, {
    type: argon2.argon2id,
  });

  // 2. Upsert Users
  const usersData = [
    {
      email: 'admin@forgeline.dev',
      name: 'Devansh Gupta (Admin)',
      handle: 'admin',
      globalRole: GlobalRole.ADMIN,
      passwordHash,
      avatarSeed: 'admin-core',
      isActive: true,
    },
    {
      email: 'pm@forgeline.dev',
      name: 'Sarah Connor (Lead PM)',
      handle: 'sarah_pm',
      globalRole: GlobalRole.PROJECT_MANAGER,
      passwordHash,
      avatarSeed: 'pm-lead',
      isActive: true,
    },
    {
      email: 'pm2@forgeline.dev',
      name: 'Marcus Vance (Associate PM)',
      handle: 'marcus_pm',
      globalRole: GlobalRole.PROJECT_MANAGER,
      passwordHash,
      avatarSeed: 'pm-marcus',
      isActive: true,
    },
    {
      email: 'member@forgeline.dev',
      name: 'Alex Mercer (Senior Eng)',
      handle: 'alex_eng',
      globalRole: GlobalRole.TEAM_MEMBER,
      passwordHash,
      avatarSeed: 'eng-alex',
      isActive: true,
    },
    {
      email: 'member2@forgeline.dev',
      name: 'Elena Rostova (Frontend Eng)',
      handle: 'elena_eng',
      globalRole: GlobalRole.TEAM_MEMBER,
      passwordHash,
      avatarSeed: 'eng-elena',
      isActive: true,
    },
    {
      email: 'viewer@forgeline.dev',
      name: 'David Kim (Executive Viewer)',
      handle: 'david_view',
      globalRole: GlobalRole.VIEWER,
      passwordHash,
      avatarSeed: 'view-david',
      isActive: true,
    },
    {
      email: 'deactivated@forgeline.dev',
      name: 'Terminated User (Audit)',
      handle: 'deactivated_user',
      globalRole: GlobalRole.TEAM_MEMBER,
      passwordHash,
      avatarSeed: 'deact-test',
      isActive: false, // For testing deactivated user blocking
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        handle: u.handle,
        globalRole: u.globalRole,
        passwordHash: u.passwordHash,
        isActive: u.isActive,
      },
      create: u,
    });
    userMap[u.handle] = user.id;
  }
  console.log(`[Seed] Seeded ${Object.keys(userMap).length} users`);

  // 3. Upsert Projects
  const projectsData = [
    {
      key: 'HLX',
      name: 'Project Helios — Core Platform Forge',
      description: 'High-throughput operational platform build for NeoStats Hackathon.',
      status: ProjectStatus.ACTIVE,
      createdBy: userMap['admin'],
      archivedAt: null,
      taskCounter: 18,
    },
    {
      key: 'AGS',
      name: 'Project Aegis — Realtime Sync Mesh',
      description: 'Low-latency Socket.IO gateway and presence coordination engine.',
      status: ProjectStatus.ACTIVE,
      createdBy: userMap['sarah_pm'],
      archivedAt: null,
      taskCounter: 14,
    },
    {
      key: 'CHR',
      name: 'Project Chronos — Legacy Migration',
      description: 'Archived dataset migration and legacy reconciliation pipeline.',
      status: ProjectStatus.ARCHIVED,
      createdBy: userMap['admin'],
      archivedAt: new Date('2026-09-15T00:00:00Z'),
      taskCounter: 8,
    },
  ];

  const projectMap: Record<string, string> = {};

  for (const p of projectsData) {
    const project = await prisma.project.upsert({
      where: { key: p.key },
      update: {
        name: p.name,
        description: p.description,
        status: p.status,
        archivedAt: p.archivedAt,
        taskCounter: p.taskCounter,
      },
      create: p,
    });
    projectMap[p.key] = project.id;
  }
  console.log(`[Seed] Seeded ${Object.keys(projectMap).length} projects`);

  // 4. Project Memberships
  const memberships = [
    // Helios (All roles represented)
    { projectKey: 'HLX', handle: 'admin', role: ProjectRole.MANAGER, addedBy: 'admin' },
    { projectKey: 'HLX', handle: 'sarah_pm', role: ProjectRole.MANAGER, addedBy: 'admin' },
    { projectKey: 'HLX', handle: 'alex_eng', role: ProjectRole.MEMBER, addedBy: 'sarah_pm' },
    { projectKey: 'HLX', handle: 'elena_eng', role: ProjectRole.MEMBER, addedBy: 'sarah_pm' },
    { projectKey: 'HLX', handle: 'david_view', role: ProjectRole.VIEWER, addedBy: 'admin' },

    // Aegis
    { projectKey: 'AGS', handle: 'sarah_pm', role: ProjectRole.MANAGER, addedBy: 'sarah_pm' },
    { projectKey: 'AGS', handle: 'marcus_pm', role: ProjectRole.MANAGER, addedBy: 'sarah_pm' },
    { projectKey: 'AGS', handle: 'alex_eng', role: ProjectRole.MEMBER, addedBy: 'marcus_pm' },
    { projectKey: 'AGS', handle: 'david_view', role: ProjectRole.VIEWER, addedBy: 'sarah_pm' },

    // Chronos
    { projectKey: 'CHR', handle: 'admin', role: ProjectRole.MANAGER, addedBy: 'admin' },
    { projectKey: 'CHR', handle: 'marcus_pm', role: ProjectRole.MANAGER, addedBy: 'admin' },
    { projectKey: 'CHR', handle: 'elena_eng', role: ProjectRole.MEMBER, addedBy: 'marcus_pm' },
  ];

  for (const m of memberships) {
    const projectId = projectMap[m.projectKey];
    const userId = userMap[m.handle];
    const addedById = userMap[m.addedBy];

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      update: {
        projectRole: m.role,
      },
      create: {
        projectId,
        userId,
        projectRole: m.role,
        addedBy: addedById,
      },
    });
  }
  console.log(`[Seed] Seeded ${memberships.length} project memberships`);

  // 5. Tasks (40 total across statuses and priorities)
  const now = Date.now();
  const dueTomorrow = new Date(now + 24 * 3600 * 1000);
  const dueIn36h = new Date(now + 36 * 3600 * 1000);
  const dueIn3Days = new Date(now + 72 * 3600 * 1000);
  const dueIn5Days = new Date(now + 120 * 3600 * 1000);

  const taskDefinitions: Array<{
    projectKey: string;
    number: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeHandle?: string;
    reporterHandle: string;
    dueDate?: Date | null;
    position: number;
  }> = [
    // Helios tasks (18 tasks)
    { projectKey: 'HLX', number: 1, title: 'Define strict authorization policy matrix', description: 'Centralize policy checks into pure PolicyService.', status: TaskStatus.DONE, priority: TaskPriority.URGENT, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: null, position: 1000 },
    { projectKey: 'HLX', number: 2, title: 'Implement atomic version conditional updates', description: 'Prevent lost updates using UPDATE ... WHERE version = x.', status: TaskStatus.DONE, priority: TaskPriority.URGENT, assigneeHandle: 'admin', reporterHandle: 'admin', dueDate: null, position: 2000 },
    { projectKey: 'HLX', number: 3, title: 'Create post-commit Socket.IO domain events', description: 'Publish realtime events exclusively after DB transaction commits.', status: TaskStatus.IN_REVIEW, priority: TaskPriority.HIGH, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: dueIn36h, position: 3000 },
    { projectKey: 'HLX', number: 4, title: 'Configure Argon2id password hashing', description: 'Ensure memory-hard hashing parameter tuning.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeHandle: 'alex_eng', reporterHandle: 'admin', dueDate: null, position: 4000 },
    { projectKey: 'HLX', number: 5, title: 'Set up rotating refresh token family tracking', description: 'Detect refresh token reuse and invalidate entire token family.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: dueTomorrow, position: 5000 },
    { projectKey: 'HLX', number: 6, title: 'Design HUD brutalist design token palette', description: 'Implement void, basalt, graphite, bone, ash, plasma, ember, ice tokens.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, assigneeHandle: 'elena_eng', reporterHandle: 'sarah_pm', dueDate: null, position: 6000 },
    { projectKey: 'HLX', number: 7, title: 'Build persistent R3F background canvas', description: 'Single WebGL context with View portals for HUD components.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: dueTomorrow, position: 7000 },
    { projectKey: 'HLX', number: 8, title: 'Implement ForgeText 3D kinetic typography', description: 'Troika-three-text SDF shader headlines with DOM accessibility fallback.', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: dueIn3Days, position: 8000 },
    { projectKey: 'HLX', number: 9, title: 'Construct side-by-side conflict resolution drawer', description: 'Resolve HTTP 409 conflicts per field with diff visualization.', status: TaskStatus.TODO, priority: TaskPriority.URGENT, assigneeHandle: 'admin', reporterHandle: 'admin', dueDate: dueIn36h, position: 9000 },
    { projectKey: 'HLX', number: 10, title: 'Design mobile-first thumb navigation bar', description: 'Optimize for 360px and 390px viewports with Vaul bottom sheet.', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: null, position: 10000 },
    { projectKey: 'HLX', number: 11, title: 'Implement touch-safe Kanban drag and drop', description: 'Configure dnd-kit sensors with distance threshold.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeHandle: 'sarah_pm', reporterHandle: 'sarah_pm', dueDate: dueTomorrow, position: 11000 },
    { projectKey: 'HLX', number: 12, title: 'Create transactional activity audit logger', description: 'Log metadata before/after diffs in identical DB transaction.', status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, assigneeHandle: 'sarah_pm', reporterHandle: 'admin', dueDate: dueIn36h, position: 12000 },
    { projectKey: 'HLX', number: 13, title: 'Build actor-excluded realtime notification badge', description: 'Deliver unread notifications without pinging initiating actor.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeHandle: 'alex_eng', reporterHandle: 'sarah_pm', dueDate: dueTomorrow, position: 13000 },
    { projectKey: 'HLX', number: 14, title: 'Benchmark WebGL performance budget tiers', description: 'Detect GPU and throttle post-processing for Tier 1 devices.', status: TaskStatus.TODO, priority: TaskPriority.LOW, assigneeHandle: 'elena_eng', reporterHandle: 'admin', dueDate: dueIn5Days, position: 14000 },
    { projectKey: 'HLX', number: 15, title: 'Scaffold Jest supertest suite on container 5433', description: 'Run full auth and policy testing matrix on test DB.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeHandle: 'alex_eng', reporterHandle: 'admin', dueDate: null, position: 15000 },
    { projectKey: 'HLX', number: 16, title: 'Implement @mention parsing and notification trigger', description: 'Extract @handle from comment body and notify referenced members.', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeHandle: 'sarah_pm', reporterHandle: 'sarah_pm', dueDate: dueIn3Days, position: 16000 },
    { projectKey: 'HLX', number: 17, title: 'Configure cursor-based task pagination endpoint', description: 'Support limit/cursor pagination with status and priority filters.', status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: null, position: 17000 },
    { projectKey: 'HLX', number: 18, title: 'Integrate Mistral AI standup digest generator', description: 'Server-side standup summary generation with graceful quota fallback.', status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, assigneeHandle: 'sarah_pm', reporterHandle: 'admin', dueDate: null, position: 18000 },

    // Aegis tasks (14 tasks)
    { projectKey: 'AGS', number: 1, title: 'Set up Socket.IO cookie handshake authentication', description: 'Extract and verify JWT during WebSocket handshake.', status: TaskStatus.DONE, priority: TaskPriority.URGENT, assigneeHandle: 'alex_eng', reporterHandle: 'sarah_pm', dueDate: null, position: 1000 },
    { projectKey: 'AGS', number: 2, title: 'Implement room scoping for user and project channels', description: 'Enforce server-side authorization before joining project rooms.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: dueTomorrow, position: 2000 },
    { projectKey: 'AGS', number: 3, title: 'Implement presence heartbeat mechanism', description: 'Track active viewers on tasks and boards with TTL in-memory cache.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeHandle: 'sarah_pm', reporterHandle: 'sarah_pm', dueDate: dueTomorrow, position: 3000 },
    { projectKey: 'AGS', number: 4, title: 'Handle client disconnect and socket teardown', description: 'Disconnect active sockets immediately when a user is deactivated.', status: TaskStatus.IN_REVIEW, priority: TaskPriority.HIGH, assigneeHandle: 'sarah_pm', reporterHandle: 'sarah_pm', dueDate: dueIn36h, position: 4000 },
    { projectKey: 'AGS', number: 5, title: 'Optimize TanStack Query cache patching', description: 'Directly update query cache from incoming WebSocket event payload.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeHandle: 'alex_eng', reporterHandle: 'marcus_pm', dueDate: null, position: 5000 },
    { projectKey: 'AGS', number: 6, title: 'Add lane transition ripple shader effect', description: 'Trigger visual ripple when another user moves a card in realtime.', status: TaskStatus.TODO, priority: TaskPriority.LOW, assigneeHandle: 'admin', reporterHandle: 'marcus_pm', dueDate: dueIn5Days, position: 6000 },
    { projectKey: 'AGS', number: 7, title: 'Stress test multi-client socket concurrency', description: 'Simulate 50 parallel clients editing lane states.', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM, assigneeHandle: 'alex_eng', reporterHandle: 'sarah_pm', dueDate: null, position: 7000 },
    { projectKey: 'AGS', number: 8, title: 'Implement dynamic room eviction on role change', description: 'Kick socket from room if member is removed from project.', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assigneeHandle: 'elena_eng', reporterHandle: 'sarah_pm', dueDate: dueIn3Days, position: 8000 },
    { projectKey: 'AGS', number: 9, title: 'Add offline recovery queue with version reconciliation', description: 'Invalidate stale queries upon network reconnect.', status: TaskStatus.BACKLOG, priority: TaskPriority.MEDIUM, assigneeHandle: 'sarah_pm', reporterHandle: 'marcus_pm', dueDate: null, position: 9000 },
    { projectKey: 'AGS', number: 10, title: 'Broadcast typing / soft editing indicator', description: 'Show user avatar on task card when editing description.', status: TaskStatus.TODO, priority: TaskPriority.LOW, assigneeHandle: 'admin', reporterHandle: 'sarah_pm', dueDate: dueIn5Days, position: 10000 },
    { projectKey: 'AGS', number: 11, title: 'Configure Redis pub/sub adapter interface', description: 'Document multi-node scaling architecture for Socket.IO gateway.', status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, assigneeHandle: 'marcus_pm', reporterHandle: 'sarah_pm', dueDate: null, position: 11000 },
    { projectKey: 'AGS', number: 12, title: 'Realtime notification audio tick (optional)', description: 'Provide subtle Web Audio UI click on incoming notification.', status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, assigneeHandle: 'marcus_pm', reporterHandle: 'marcus_pm', dueDate: null, position: 12000 },
    { projectKey: 'AGS', number: 13, title: 'Verify rate limiting on socket reconnection storms', description: 'Prevent DoS from rapid socket reconnect attempts.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, assigneeHandle: 'alex_eng', reporterHandle: 'sarah_pm', dueDate: null, position: 13000 },
    { projectKey: 'AGS', number: 14, title: 'Verify CORS origin verification on WS handshake', description: 'Strictly check origin header matches WEB_ORIGIN.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeHandle: 'alex_eng', reporterHandle: 'sarah_pm', dueDate: null, position: 14000 },

    // Chronos tasks (8 tasks - mostly archived/done)
    { projectKey: 'CHR', number: 1, title: 'Export legacy MySQL schemas to PostgreSQL DDL', description: 'Convert table schemas and foreign key constraints.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeHandle: 'elena_eng', reporterHandle: 'admin', dueDate: null, position: 1000 },
    { projectKey: 'CHR', number: 2, title: 'Sanitize user legacy handles and emails', description: 'Ensure unique handles and valid email formats.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, assigneeHandle: 'elena_eng', reporterHandle: 'admin', dueDate: null, position: 2000 },
    { projectKey: 'CHR', number: 3, title: 'Hash legacy MD5 passwords to Argon2id', description: 'One-time upgrade script executed for legacy credentials.', status: TaskStatus.DONE, priority: TaskPriority.URGENT, assigneeHandle: 'marcus_pm', reporterHandle: 'admin', dueDate: null, position: 3000 },
    { projectKey: 'CHR', number: 4, title: 'Verify foreign key relational integrity', description: 'Audit orphaned task rows and null assignees.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeHandle: 'elena_eng', reporterHandle: 'marcus_pm', dueDate: null, position: 4000 },
    { projectKey: 'CHR', number: 5, title: 'Generate final migration snapshot audit log', description: 'Record checksum of migrated records into activity log.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, assigneeHandle: 'marcus_pm', reporterHandle: 'admin', dueDate: null, position: 5000 },
    { projectKey: 'CHR', number: 6, title: 'Archive database schema in cold storage', description: 'Mark project as ARCHIVED and lock mutation endpoints.', status: TaskStatus.DONE, priority: TaskPriority.LOW, assigneeHandle: 'marcus_pm', reporterHandle: 'admin', dueDate: null, position: 6000 },
    { projectKey: 'CHR', number: 7, title: 'Decommission legacy VPS server instance', description: 'Safely terminate deprecated database instances.', status: TaskStatus.DONE, priority: TaskPriority.LOW, assigneeHandle: 'admin', reporterHandle: 'admin', dueDate: null, position: 7000 },
    { projectKey: 'CHR', number: 8, title: 'Post-migration retrospective document', description: 'Document lessons learned in docs/ARCHIVED_MIGRATION.md.', status: TaskStatus.DONE, priority: TaskPriority.LOW, assigneeHandle: 'marcus_pm', reporterHandle: 'admin', dueDate: null, position: 8000 },
  ];

  const taskMap: Record<string, string> = {};

  for (const t of taskDefinitions) {
    const projectId = projectMap[t.projectKey];
    const reporterId = userMap[t.reporterHandle];
    const assigneeId = t.assigneeHandle ? userMap[t.assigneeHandle] : null;

    const task = await prisma.task.upsert({
      where: {
        projectId_number: {
          projectId,
          number: t.number,
        },
      },
      update: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assigneeId,
        dueDate: t.dueDate ?? null,
        position: t.position,
      },
      create: {
        projectId,
        number: t.number,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assigneeId,
        reporterId,
        dueDate: t.dueDate ?? null,
        position: t.position,
        version: 1,
      },
    });

    taskMap[`${t.projectKey}-${t.number}`] = task.id;
  }
  console.log(`[Seed] Seeded ${Object.keys(taskMap).length} tasks`);

  // 6. Comments with @mentions
  const commentsData = [
    {
      taskKey: 'HLX-1',
      projectKey: 'HLX',
      authorHandle: 'sarah_pm',
      body: 'Great progress @alex_eng! Ensure that Team Members cannot modify tasks not assigned to them.',
      mentionHandles: ['alex_eng'],
    },
    {
      taskKey: 'HLX-1',
      projectKey: 'HLX',
      authorHandle: 'alex_eng',
      body: 'Understood @sarah_pm. Verified via unit test matrix covering all 4 roles and ownership rules.',
      mentionHandles: ['sarah_pm'],
    },
    {
      taskKey: 'HLX-2',
      projectKey: 'HLX',
      authorHandle: 'admin',
      body: 'Please double-check that zero rows returned by atomic update throws HTTP 409.',
      mentionHandles: ['alex_eng'],
    },
    {
      taskKey: 'HLX-3',
      projectKey: 'HLX',
      authorHandle: 'elena_eng',
      body: 'Domain event bus is wired up. Verified that rollback prevents phantom emissions.',
      mentionHandles: ['sarah_pm'],
    },
    {
      taskKey: 'AGS-1',
      projectKey: 'AGS',
      authorHandle: 'alex_eng',
      body: 'Cookie parser extracts the JWT in handshake middleware smoothly.',
      mentionHandles: ['sarah_pm'],
    },
  ];

  for (const c of commentsData) {
    const taskId = taskMap[c.taskKey];
    const projectId = projectMap[c.projectKey];
    const authorId = userMap[c.authorHandle];
    const mentions = c.mentionHandles.map((h) => userMap[h]);

    // Simple idempotency check on first comment matching task + author + body
    const existing = await prisma.comment.findFirst({
      where: { taskId, authorId, body: c.body },
    });

    if (!existing) {
      await prisma.comment.create({
        data: {
          taskId,
          projectId,
          authorId,
          body: c.body,
          mentions,
        },
      });
    }
  }
  console.log(`[Seed] Seeded comments with @mentions`);

  // 7. Activity Logs
  const activities = [
    {
      projectKey: 'HLX',
      userHandle: 'admin',
      action: 'project.created',
      entityType: 'project',
      entityId: projectMap['HLX'],
      metadata: { name: 'Project Helios', key: 'HLX' },
    },
    {
      projectKey: 'HLX',
      userHandle: 'sarah_pm',
      action: 'task.status_changed',
      entityType: 'task',
      entityId: taskMap['HLX-1'],
      metadata: { from: 'IN_REVIEW', to: 'DONE', title: 'Define strict authorization policy matrix' },
    },
    {
      projectKey: 'HLX',
      userHandle: 'alex_eng',
      action: 'comment.created',
      entityType: 'comment',
      entityId: taskMap['HLX-1'],
      metadata: { taskKey: 'HLX-1' },
    },
    {
      projectKey: 'AGS',
      userHandle: 'sarah_pm',
      action: 'project.created',
      entityType: 'project',
      entityId: projectMap['AGS'],
      metadata: { name: 'Project Aegis', key: 'AGS' },
    },
    {
      projectKey: 'CHR',
      userHandle: 'admin',
      action: 'project.archived',
      entityType: 'project',
      entityId: projectMap['CHR'],
      metadata: { reason: 'Migration completed' },
    },
  ];

  for (const a of activities) {
    const projectId = projectMap[a.projectKey];
    const userId = userMap[a.userHandle];

    const existing = await prisma.activityLog.findFirst({
      where: { projectId, userId, action: a.action, entityId: a.entityId },
    });

    if (!existing) {
      await prisma.activityLog.create({
        data: {
          projectId,
          userId,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          metadata: a.metadata,
        },
      });
    }
  }
  console.log(`[Seed] Seeded activity logs`);

  // 8. Notifications (with unread and read states; actor != recipient)
  const notifications = [
    {
      recipientHandle: 'alex_eng',
      actorHandle: 'sarah_pm',
      type: 'task.assigned',
      projectKey: 'HLX',
      entityType: 'task',
      entityId: taskMap['HLX-5'],
      payload: { taskNumber: 5, title: 'Set up rotating refresh token family tracking' },
      readAt: null, // UNREAD
    },
    {
      recipientHandle: 'alex_eng',
      actorHandle: 'sarah_pm',
      type: 'task.mentioned',
      projectKey: 'HLX',
      entityType: 'comment',
      entityId: taskMap['HLX-1'],
      payload: { taskNumber: 1, message: 'Mentioned you in HLX-1' },
      readAt: null, // UNREAD
    },
    {
      recipientHandle: 'elena_eng',
      actorHandle: 'sarah_pm',
      type: 'task.assigned',
      projectKey: 'HLX',
      entityType: 'task',
      entityId: taskMap['HLX-7'],
      payload: { taskNumber: 7, title: 'Build persistent R3F background canvas' },
      readAt: new Date(), // READ
    },
    {
      recipientHandle: 'admin',
      actorHandle: 'alex_eng',
      type: 'task.mentioned',
      projectKey: 'HLX',
      entityType: 'comment',
      entityId: taskMap['HLX-2'],
      payload: { taskNumber: 2, message: 'Mentioned @admin in HLX-2 regarding concurrency lock fallback' },
      readAt: null, // UNREAD
    },
    {
      recipientHandle: 'admin',
      actorHandle: 'sarah_pm',
      type: 'task.status_changed',
      projectKey: 'HLX',
      entityType: 'task',
      entityId: taskMap['HLX-3'],
      payload: { taskNumber: 3, title: 'Draft schema for optimistic concurrency version column', status: 'IN_REVIEW' },
      readAt: null, // UNREAD
    },
    {
      recipientHandle: 'sarah_pm',
      actorHandle: 'admin',
      type: 'project.assigned',
      projectKey: 'HLX',
      entityType: 'project',
      entityId: projectMap['HLX'],
      payload: { projectName: 'Project Helios', role: 'MANAGER' },
      readAt: new Date(), // READ
    },
  ];

  for (const n of notifications) {
    const userId = userMap[n.recipientHandle];
    const actorId = userMap[n.actorHandle];
    const projectId = projectMap[n.projectKey];

    const existing = await prisma.notification.findFirst({
      where: { userId, actorId, entityId: n.entityId, type: n.type },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          actorId,
          projectId,
          type: n.type,
          entityType: n.entityType,
          entityId: n.entityId,
          payload: n.payload,
          readAt: n.readAt,
        },
      });
    }
  }
  console.log(`[Seed] Seeded notifications with read and unread status`);

  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
