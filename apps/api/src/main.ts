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

  // Security headers
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Cookies for JWT authentication
  app.use(cookieParser());

  // Cross-port CORS
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-Match', 'Idempotency-Key', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  });

  // Enable graceful shutdown hooks for Prisma
  app.enableShutdownHooks();

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FORGELINE API')
    .setDescription(
      'Multi-user collaborative project management engine for NeoStats Hackathon. Implements server-side authorization and optimistic concurrency control.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer-jwt')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie', name: 'access_token' })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Forgeline API Documentation',
  });

  await app.listen(port);
  console.log(`[Forgeline API] Server live at http://localhost:${port}/api/v1`);
  console.log(`[Forgeline API] Swagger UI available at http://localhost:${port}/api/docs`);
}

bootstrap();
