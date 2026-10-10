import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  const port = process.env.API_PORT || 4000;

  // Global API v1 prefix
  app.setGlobalPrefix('api/v1');

  // Cookie parser for JWT in httpOnly cookies
  app.use(cookieParser());

  // CORS configuration for cross-port Next.js -> NestJS with credentials
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-Match', 'Idempotency-Key'],
  });

  await app.listen(port);
  console.log(`[Forgeline API] Running on http://localhost:${port}/api/v1 (CORS origin: ${webOrigin})`);
}

bootstrap();
