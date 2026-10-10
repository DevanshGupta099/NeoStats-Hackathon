import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { GlobalRole } from '@prisma/client';

describe('Auth Module & Cross-Cutting Infra (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Ensure test environment points to test database on port 5433
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

    // Ensure seeded test users exist in the test database
    const passwordHash = await argon2.hash('Forge@12345', { type: argon2.argon2id });

    await prisma.user.upsert({
      where: { email: 'admin@forgeline.dev' },
      update: { passwordHash, isActive: true },
      create: {
        email: 'admin@forgeline.dev',
        name: 'Devansh Gupta (Admin)',
        handle: 'admin_test',
        passwordHash,
        globalRole: GlobalRole.ADMIN,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'deactivated@forgeline.dev' },
      update: { passwordHash, isActive: false },
      create: {
        email: 'deactivated@forgeline.dev',
        name: 'Deactivated User',
        handle: 'deactivated_test',
        passwordHash,
        globalRole: GlobalRole.TEAM_MEMBER,
        isActive: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('GET /api/v1/health should return ok and service info', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('forgeline-api');
    });

    it('GET /api/v1/health/db should verify database connectivity', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health/db');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(typeof res.body.latencyMs).toBe('number');
    });
  });

  describe('Authentication & Security', () => {
    let initialAccessTokenCookie: string;
    let initialRefreshTokenCookie: string;
    let rawRefreshTokenValue: string;

    it('POST /api/v1/auth/login - should log in successfully with valid credentials and set cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@forgeline.dev',
          password: 'Forge@12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@forgeline.dev');
      expect(res.body.user.passwordHash).toBeUndefined(); // Never leak passwordHash

      // Verify cookies
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('access_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('refresh_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
      expect(cookies.some((c) => c.includes('SameSite=Lax'))).toBe(true);

      // Save for subsequent tests
      initialAccessTokenCookie = cookies.find((c) => c.startsWith('access_token='))!;
      initialRefreshTokenCookie = cookies.find((c) => c.startsWith('refresh_token='))!;
      rawRefreshTokenValue = initialRefreshTokenCookie.split(';')[0].split('=')[1];
    });

    it('POST /api/v1/auth/login - should fail with 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@forgeline.dev',
          password: 'WrongPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
      expect(res.body.error.requestId).toBeDefined();
    });

    it('POST /api/v1/auth/login - lockout-safe message prevents user enumeration on non-existent account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent_account_12345@forgeline.dev',
          password: 'SomePassword123',
        });

      expect(res.status).toBe(401);
      // Identical code and message as wrong password to prevent user enumeration
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('POST /api/v1/auth/login - should block deactivated users with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'deactivated@forgeline.dev',
          password: 'Forge@12345',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DEACTIVATED');
      expect(res.body.error.message).toContain('Account has been deactivated');
    });

    it('POST /api/v1/auth/login - validation failure should return 422 with field details envelope', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email-format',
          password: '123', // less than 6 chars
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details?.fields).toBeDefined();
      expect(res.body.error.details.fields.email).toBeDefined();
      expect(res.body.error.details.fields.password).toBeDefined();
      expect(res.body.error.requestId).toBeDefined();
    });

    it('GET /api/v1/auth/me - unauthenticated request returns 401 in standard envelope', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Authentication token is required');
      expect(res.body.error.requestId).toBeDefined();
    });

    it('GET /api/v1/auth/me - authenticated request with cookie returns user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', [initialAccessTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@forgeline.dev');
      expect(res.body.user.globalRole).toBe(GlobalRole.ADMIN);
    });

    it('POST /api/v1/auth/refresh - should rotate refresh token and issue new access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [initialRefreshTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.message).toBe('Token rotated successfully');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const newRefreshTokenCookie = cookies.find((c) => c.startsWith('refresh_token='))!;
      const newRefreshTokenValue = newRefreshTokenCookie.split(';')[0].split('=')[1];

      // Refresh token value MUST have changed (rotation)
      expect(newRefreshTokenValue).not.toBe(rawRefreshTokenValue);
    });

    it('POST /api/v1/auth/refresh - REUSE DETECTION: reusing previously rotated token revokes family', async () => {
      // Attempt to reuse the OLD (now revoked) refresh token
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${rawRefreshTokenValue}`]);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('REFRESH_TOKEN_REUSE_DETECTED');
      expect(res.body.error.message).toContain('Refresh token reuse detected');
    });

    it('POST /api/v1/auth/logout - clears authentication cookies', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      // Cookies cleared with empty value or past expiration
      expect(cookies.some((c) => c.includes('access_token=;'))).toBe(true);
      expect(cookies.some((c) => c.includes('refresh_token=;'))).toBe(true);
    });
  });
});
