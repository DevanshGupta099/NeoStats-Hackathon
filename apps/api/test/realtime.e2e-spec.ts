import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { io, Socket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { GlobalRole, ProjectRole, TaskStatus } from '@prisma/client';
import { RealtimeEvents, ClientRealtimeEvents } from '@forgeline/shared';

describe('Real-Time Gateway & Event Propagation (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let port: number;

  let pmCookie: string;
  let memberCookie: string;
  let outsiderCookie: string;

  let pmUser: any;
  let memberUser: any;
  let outsiderUser: any;

  let testProject: any;
  let testTask: any;

  let clientA: Socket; // PM
  let clientB: Socket; // Member
  let clientOutsider: Socket; // Non-member

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
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    port = address.port;

    prisma = app.get(PrismaService);

    const passwordHash = await argon2.hash('Forge@12345', { type: argon2.argon2id });

    // Setup users
    pmUser = await prisma.user.upsert({
      where: { email: 'pm_rt@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.PROJECT_MANAGER },
      create: {
        email: 'pm_rt@forgeline.dev',
        name: 'PM Realtime',
        handle: 'pm_rt',
        passwordHash,
        globalRole: GlobalRole.PROJECT_MANAGER,
        isActive: true,
      },
    });

    memberUser = await prisma.user.upsert({
      where: { email: 'member_rt@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.TEAM_MEMBER },
      create: {
        email: 'member_rt@forgeline.dev',
        name: 'Member Realtime',
        handle: 'member_rt',
        passwordHash,
        globalRole: GlobalRole.TEAM_MEMBER,
        isActive: true,
      },
    });

    outsiderUser = await prisma.user.upsert({
      where: { email: 'outsider_rt@forgeline.dev' },
      update: { passwordHash, isActive: true, globalRole: GlobalRole.TEAM_MEMBER },
      create: {
        email: 'outsider_rt@forgeline.dev',
        name: 'Outsider Realtime',
        handle: 'outsider_rt',
        passwordHash,
        globalRole: GlobalRole.TEAM_MEMBER,
        isActive: true,
      },
    });

    // Setup project and memberships
    testProject = await prisma.project.upsert({
      where: { key: 'RTPROJ' },
      update: { name: 'Realtime Project', createdBy: pmUser.id, version: 1, taskCounter: 1 },
      create: {
        name: 'Realtime Project',
        key: 'RTPROJ',
        description: 'Testing live event sync',
        createdBy: pmUser.id,
        version: 1,
        taskCounter: 1,
      },
    });

    await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await prisma.projectMember.createMany({
      data: [
        { projectId: testProject.id, userId: pmUser.id, projectRole: ProjectRole.MANAGER, addedBy: pmUser.id },
        { projectId: testProject.id, userId: memberUser.id, projectRole: ProjectRole.MEMBER, addedBy: pmUser.id },
      ],
    });

    await prisma.task.deleteMany({ where: { projectId: testProject.id } });
    testTask = await prisma.task.create({
      data: {
        projectId: testProject.id,
        number: 1,
        title: 'Initial Realtime Task',
        status: TaskStatus.TODO,
        assigneeId: memberUser.id,
        reporterId: pmUser.id,
        version: 1,
      },
    });

    // Login users to acquire auth cookies
    const loginUser = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'Forge@12345' });
      const cookies = res.headers['set-cookie'] as unknown as string[];
      return cookies.map((c) => c.split(';')[0]).join('; ');
    };

    pmCookie = await loginUser('pm_rt@forgeline.dev');
    memberCookie = await loginUser('member_rt@forgeline.dev');
    outsiderCookie = await loginUser('outsider_rt@forgeline.dev');
  });

  afterAll(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();
    if (clientOutsider?.connected) clientOutsider.disconnect();
    await app.close();
  });

  it('Sockets authenticate via handshake cookie and establish connection', async () => {
    clientA = io(`http://localhost:${port}`, {
      extraHeaders: { Cookie: pmCookie },
      transports: ['websocket'],
    });

    clientB = io(`http://localhost:${port}`, {
      extraHeaders: { Cookie: memberCookie },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => clientA.on('connect', () => resolve())),
      new Promise<void>((resolve) => clientB.on('connect', () => resolve())),
    ]);

    expect(clientA.connected).toBe(true);
    expect(clientB.connected).toBe(true);
  });

  it('Non-member client join request to project room is denied', async () => {
    clientOutsider = io(`http://localhost:${port}`, {
      extraHeaders: { Cookie: outsiderCookie },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => clientOutsider.on('connect', () => resolve()));
    expect(clientOutsider.connected).toBe(true);

    const joinResponse = await new Promise<any>((resolve) => {
      clientOutsider.emit(
        ClientRealtimeEvents.PROJECT_JOIN,
        { projectId: testProject.id },
        (response: any) => resolve(response),
      );
    });

    expect(joinResponse.success).toBe(false);
    expect(joinResponse.error).toMatch(/Access denied/);
  });

  it('Member client joins project room and receives live presence roster', async () => {
    const joinResponse = await new Promise<any>((resolve) => {
      clientB.emit(
        ClientRealtimeEvents.PROJECT_JOIN,
        { projectId: testProject.id },
        (response: any) => resolve(response),
      );
    });

    expect(joinResponse.success).toBe(true);
    expect(joinResponse.projectId).toBe(testProject.id);
    expect(Array.isArray(joinResponse.activeUsers)).toBe(true);
    expect(joinResponse.activeUsers.some((u: any) => u.userId === memberUser.id)).toBe(true);
  });

  it('HTTP mutation by User A propagates Live Event to Project Room with updated version for User B', async () => {
    const eventPromise = new Promise<any>((resolve) => {
      clientB.once(RealtimeEvents.TASK_UPDATED, (envelope: any) => {
        resolve(envelope);
      });
    });

    // PM mutates task via HTTP PATCH
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${testTask.id}`)
      .set('Cookie', pmCookie)
      .send({
        title: 'Title mutated via HTTP',
        version: 1,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.version).toBe(2);

    const receivedEnvelope = await eventPromise;
    expect(receivedEnvelope.event).toBe(RealtimeEvents.TASK_UPDATED);
    expect(receivedEnvelope.projectId).toBe(testProject.id);
    expect(receivedEnvelope.actorId).toBe(pmUser.id);
    expect(receivedEnvelope.version).toBe(2);
    expect(receivedEnvelope.data.title).toBe('Title mutated via HTTP');
  });

  it('Evicted member stops receiving real-time events for subsequent project mutations', async () => {
    let receivedAfterRemoval = false;
    clientB.on(RealtimeEvents.TASK_UPDATED, () => {
      receivedAfterRemoval = true;
    });

    // PM removes member from project
    const removeRes = await request(app.getHttpServer())
      .delete(`/api/v1/projects/${testProject.id}/members/${memberUser.id}`)
      .set('Cookie', pmCookie);
    expect(removeRes.status).toBe(200);

    // Wait 100ms for eviction to settle
    await new Promise((r) => setTimeout(r, 100));

    // PM performs another task mutation
    const patchRes2 = await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${testTask.id}`)
      .set('Cookie', pmCookie)
      .send({
        title: 'Title mutated after member eviction',
        version: 2,
      });

    expect(patchRes2.status).toBe(200);

    // Wait 200ms to ensure clientB received nothing
    await new Promise((r) => setTimeout(r, 200));
    expect(receivedAfterRemoval).toBe(false);
  });
});
