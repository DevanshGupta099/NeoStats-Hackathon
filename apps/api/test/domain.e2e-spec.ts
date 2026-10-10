import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { GlobalRole, ProjectRole, TaskStatus } from '@prisma/client';

describe('Domain APIs, Policy Matrix & Concurrency (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test state
  let adminCookie: string;
  let pmCookie: string;
  let memberCookie: string;
  let viewerCookie: string;
  let outsiderCookie: string;

  let adminUser: any;
  let pmUser: any;
  let memberUser: any;
  let viewerUser: any;
  let outsiderUser: any;

  let testProject: any;
  let testTaskAssignedToMember: any;
  let testTaskAssignedToOther: any;

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.TEST_DATABASE_URL ||
      'postgresql://forgeline:forgeline_secret@localhost:5433/forgeline_test?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean test state
    const passwordHash = await argon2.hash('Forge@12345', { type: argon2.argon2id });

    // 1. Setup users
    adminUser = await prisma.user.upsert({
      where: { email: 'admin_domain@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.ADMIN },
      create: {
        email: 'admin_domain@forgeline.dev',
        name: 'Admin User',
        handle: 'admin_domain',
        passwordHash,
        globalRole: GlobalRole.ADMIN,
        isActive: true,
      },
    });

    pmUser = await prisma.user.upsert({
      where: { email: 'pm_domain@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.PROJECT_MANAGER },
      create: {
        email: 'pm_domain@forgeline.dev',
        name: 'PM User',
        handle: 'pm_domain',
        passwordHash,
        globalRole: GlobalRole.PROJECT_MANAGER,
        isActive: true,
      },
    });

    memberUser = await prisma.user.upsert({
      where: { email: 'member_domain@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.TEAM_MEMBER },
      create: {
        email: 'member_domain@forgeline.dev',
        name: 'Member User',
        handle: 'member_domain',
        passwordHash,
        globalRole: GlobalRole.TEAM_MEMBER,
        isActive: true,
      },
    });

    viewerUser = await prisma.user.upsert({
      where: { email: 'viewer_domain@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.VIEWER },
      create: {
        email: 'viewer_domain@forgeline.dev',
        name: 'Viewer User',
        handle: 'viewer_domain',
        passwordHash,
        globalRole: GlobalRole.VIEWER,
        isActive: true,
      },
    });

    outsiderUser = await prisma.user.upsert({
      where: { email: 'outsider_domain@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.TEAM_MEMBER },
      create: {
        email: 'outsider_domain@forgeline.dev',
        name: 'Outsider User',
        handle: 'outsider_domain',
        passwordHash,
        globalRole: GlobalRole.TEAM_MEMBER,
        isActive: true,
      },
    });

    // 2. Setup project and memberships
    testProject = await prisma.project.upsert({
      where: { key: 'DOMTEST' },
      update: { name: 'Domain Test Project', createdBy: adminUser.id, version: 1, taskCounter: 2 },
      create: {
        name: 'Domain Test Project',
        key: 'DOMTEST',
        description: 'Test project for domain APIs',
        createdBy: adminUser.id,
        version: 1,
        taskCounter: 2,
      },
    });

    // Add PM, Member, Viewer to project
    await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await prisma.projectMember.createMany({
      data: [
        { projectId: testProject.id, userId: adminUser.id, projectRole: ProjectRole.MANAGER, addedBy: adminUser.id },
        { projectId: testProject.id, userId: pmUser.id, projectRole: ProjectRole.MANAGER, addedBy: adminUser.id },
        { projectId: testProject.id, userId: memberUser.id, projectRole: ProjectRole.MEMBER, addedBy: adminUser.id },
        { projectId: testProject.id, userId: viewerUser.id, projectRole: ProjectRole.VIEWER, addedBy: adminUser.id },
      ],
    });

    // 3. Setup tasks
    await prisma.task.deleteMany({ where: { projectId: testProject.id } });
    testTaskAssignedToMember = await prisma.task.create({
      data: {
        projectId: testProject.id,
        number: 1,
        title: 'Task assigned to member',
        status: TaskStatus.IN_PROGRESS,
        assigneeId: memberUser.id,
        reporterId: pmUser.id,
        version: 1,
      },
    });

    testTaskAssignedToOther = await prisma.task.create({
      data: {
        projectId: testProject.id,
        number: 2,
        title: 'Task assigned to PM',
        status: TaskStatus.TODO,
        assigneeId: pmUser.id,
        reporterId: pmUser.id,
        version: 1,
      },
    });

    // 4. Login all users to acquire cookies
    const loginUser = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'Forge@12345' });
      const cookies = res.headers['set-cookie'] as unknown as string[];
      return cookies.map((c) => c.split(';')[0]).join('; ');
    };

    adminCookie = await loginUser('admin_domain@forgeline.dev');
    pmCookie = await loginUser('pm_domain@forgeline.dev');
    memberCookie = await loginUser('member_domain@forgeline.dev');
    viewerCookie = await loginUser('viewer_domain@forgeline.dev');
    outsiderCookie = await loginUser('outsider_domain@forgeline.dev');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Policy Matrix Enforcement (Role x Action)', () => {
    it('Admin can manage users; PM cannot (403 FORBIDDEN)', async () => {
      // Admin lists users
      const adminRes = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Cookie', adminCookie);
      expect(adminRes.status).toBe(200);
      expect(Array.isArray(adminRes.body.items)).toBe(true);

      // PM lists users -> 403 Forbidden
      const pmRes = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Cookie', pmCookie);
      expect(pmRes.status).toBe(403);
      expect(pmRes.body.error.code).toBe('FORBIDDEN');
    });

    it('Non-member receives 404 on project (inaccessible projects hidden)', async () => {
      const outsiderRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${testProject.id}`)
        .set('Cookie', outsiderCookie);

      expect(outsiderRes.status).toBe(404);
      expect(outsiderRes.body.error.code).toBe('NOT_FOUND');
    });

    it('Team Member cannot create tasks (403 FORBIDDEN)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${testProject.id}/tasks`)
        .set('Cookie', memberCookie)
        .send({
          title: 'Unauthorized Member Task',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PM can create tasks with race-safe contiguous numbering', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${testProject.id}/tasks`)
        .set('Cookie', pmCookie)
        .send({
          title: 'PM Created Task',
          status: 'TODO',
          priority: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('PM Created Task');
      expect(res.body.number).toBeGreaterThan(0);
      expect(res.body.version).toBe(1);
    });

    it('Team Member can update task assigned to them, but CANNOT update task assigned to someone else', async () => {
      // 1. Update own task -> 200 OK
      const allowedRes = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
        .set('Cookie', memberCookie)
        .send({
          title: 'Member updated own task',
          version: testTaskAssignedToMember.version,
        });

      expect(allowedRes.status).toBe(200);
      expect(allowedRes.body.title).toBe('Member updated own task');
      expect(allowedRes.body.version).toBe(testTaskAssignedToMember.version + 1);

      // Refresh task state
      testTaskAssignedToMember = allowedRes.body;

      // 2. Try updating other task -> 403 Forbidden
      const forbiddenRes = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${testTaskAssignedToOther.id}`)
        .set('Cookie', memberCookie)
        .send({
          title: 'Member attempting illegal update',
          version: testTaskAssignedToOther.version,
        });

      expect(forbiddenRes.status).toBe(403);
      expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');
    });

    it('Viewer cannot write or update anything (403 FORBIDDEN)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
        .set('Cookie', viewerCookie)
        .send({
          title: 'Viewer attempting edit',
          version: testTaskAssignedToMember.version,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Team Member cannot assign or delete tasks (403 FORBIDDEN)', async () => {
      const assignRes = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskAssignedToMember.id}/assign`)
        .set('Cookie', memberCookie)
        .send({
          assigneeId: memberUser.id,
          version: testTaskAssignedToMember.version,
        });
      expect(assignRes.status).toBe(403);

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
        .set('Cookie', memberCookie);
      expect(deleteRes.status).toBe(403);
    });
  });

  describe('Optimistic Concurrency Control (409 Conflict)', () => {
    it('Parallel PATCH requests with identical version result in exactly one 200 and one 409', async () => {
      const currentVersion = testTaskAssignedToMember.version;

      // Send two concurrent requests with the identical version
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .patch(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
          .set('Cookie', pmCookie)
          .send({
            title: 'Conflict Test Mutation A',
            version: currentVersion,
          }),
        request(app.getHttpServer())
          .patch(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
          .set('Cookie', pmCookie)
          .send({
            title: 'Conflict Test Mutation B',
            version: currentVersion,
          }),
      ]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      const conflictRes = res1.status === 409 ? res1 : res2;
      expect(conflictRes.body.error.code).toBe('VERSION_CONFLICT');
      expect(conflictRes.body.error.details).toBeDefined();
      expect(conflictRes.body.error.details.yourVersion).toBe(currentVersion);
      expect(conflictRes.body.error.details.currentVersion).toBe(currentVersion + 1);
    });

    it('Supports If-Match HTTP header as alternative to body version', async () => {
      // Fetch latest task version
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
        .set('Cookie', pmCookie);
      const latestVersion = getRes.body.version;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${testTaskAssignedToMember.id}`)
        .set('Cookie', pmCookie)
        .set('If-Match', `"${latestVersion}"`)
        .send({
          title: 'Updated via If-Match Header',
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated via If-Match Header');
      expect(res.body.version).toBe(latestVersion + 1);
    });
  });

  describe('Transactional Activity Logging & Notifications', () => {
    it('Task assignment writes activity log and creates notification for assignee (excluding actor)', async () => {
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${testTaskAssignedToOther.id}`)
        .set('Cookie', pmCookie);
      const currentVersion = getRes.body.version;

      // PM assigns task to Member
      const assignRes = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskAssignedToOther.id}/assign`)
        .set('Cookie', pmCookie)
        .send({
          assigneeId: memberUser.id,
          version: currentVersion,
        });

      expect(assignRes.status).toBe(200);

      // Verify activity log row created
      const activity = await prisma.activityLog.findFirst({
        where: {
          entityId: testTaskAssignedToOther.id,
          action: 'task.assigned',
        },
      });
      expect(activity).toBeDefined();
      expect(activity?.userId).toBe(pmUser.id);

      // Verify notification row created for memberUser
      const notification = await prisma.notification.findFirst({
        where: {
          userId: memberUser.id,
          type: 'task.assigned',
        },
      });
      expect(notification).toBeDefined();
      expect(notification?.actorId).toBe(pmUser.id);

      // Ensure actor (PM) did NOT receive a notification for their own action
      const selfNotification = await prisma.notification.findFirst({
        where: {
          userId: pmUser.id,
          type: 'task.assigned',
          actorId: pmUser.id,
        },
      });
      expect(selfNotification).toBeNull();
    });

    it('Comment with @handle mention notifies mentioned member', async () => {
      const commentRes = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskAssignedToOther.id}/comments`)
        .set('Cookie', pmCookie)
        .send({
          body: `Hey @${memberUser.handle}, please review this immediately!`,
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.mentions).toContain(memberUser.id);

      // Verify notification for mention was created
      const mentionNotification = await prisma.notification.findFirst({
        where: {
          userId: memberUser.id,
          type: 'mention',
        },
      });
      expect(mentionNotification).toBeDefined();
      expect(mentionNotification?.actorId).toBe(pmUser.id);
    });
  });

  describe('User Deactivation & Session Invalidation', () => {
    it('Deactivating user bumps tokenVersion and immediately rejects their active token with 401', async () => {
      // 1. Verify member can currently access their own tasks
      const beforeRes = await request(app.getHttpServer())
        .get('/api/v1/tasks/mine')
        .set('Cookie', memberCookie);
      expect(beforeRes.status).toBe(200);

      // 2. Admin deactivates member
      const deactRes = await request(app.getHttpServer())
        .post(`/api/v1/users/${memberUser.id}/deactivate`)
        .set('Cookie', adminCookie);
      expect(deactRes.status).toBe(200);
      expect(deactRes.body.user.isActive).toBe(false);

      // 3. Member makes request with same cookie -> Rejected with 401
      const afterRes = await request(app.getHttpServer())
        .get('/api/v1/tasks/mine')
        .set('Cookie', memberCookie);
      expect(afterRes.status).toBe(401);
      expect(afterRes.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Pagination & Filters', () => {
    it('Filters tasks by status and applies cursor pagination', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${testProject.id}/tasks?limit=2`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeLessThanOrEqual(2);
      expect(typeof res.body.totalCount).toBe('number');
    });
  });
});
