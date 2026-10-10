import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  const port = process.env.API_PORT || 4000;

  // Structured logger
  app.useLogger(app.get(Logger));

  // Security headers (disable CSP so Swagger UI interactive bundle can execute)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Handle bare root GET / with redirect to /api/v1 and /docs redirect to /api/docs
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter && typeof (httpAdapter as any).getInstance === 'function') {
    const expressApp = (httpAdapter as any).getInstance();
    expressApp.get('/', (_req: any, res: any) => {
      res.redirect('/api/v1');
    });
    expressApp.get(['/docs', '/swagger', '/api-docs'], (_req: any, res: any) => {
      res.redirect('/api/docs');
    });
  }

  // Cookies for JWT authentication
  app.use(cookieParser());

  // Cross-port CORS
  app.enableCors({
    origin: [
      webOrigin,
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'If-Match',
      'Idempotency-Key',
      'x-request-id',
      'Cookie',
    ],
    exposedHeaders: ['x-request-id', 'Set-Cookie'],
  });

  // Enable graceful shutdown hooks for Prisma
  app.enableShutdownHooks();

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FORGELINE API')
    .setDescription(
      'Multi-user collaborative project management engine for NeoStats Hackathon. Implements server-side authorization and optimistic concurrency control.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer-jwt')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie', name: 'access_token' })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Forgeline API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
    },
  });

  await app.listen(port);
  console.log(`[Forgeline API] Server live at http://localhost:${port}/api/v1`);
  console.log(`[Forgeline API] Swagger UI available at http://localhost:${port}/api/docs`);
}

bootstrap();
