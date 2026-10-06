import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import * as path from 'path';

import { AppModule } from './app.module';
import { rateLimitMiddleware } from './security/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', 1);

  const isProduction =
    process.env.NODE_ENV ===
    'production';

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (
    isProduction &&
    origins.length === 0
  ) {
    throw new Error(
      'CORS_ORIGINS is required in production',
    );
  }

  const jwtSecret =
    process.env.JWT_SECRET?.trim();

  if (
    isProduction &&
    (!jwtSecret ||
      jwtSecret.length < 32)
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters in production',
    );
  }

  if (
    isProduction &&
    process.env
      .TELEGRAM_AUTH_DISABLED ===
      'true'
  ) {
    throw new Error(
      'TELEGRAM_AUTH_DISABLED must not be true in production',
    );
  }

  app.enableCors({
    origin:
      origins.length > 0
        ? origins
        : !isProduction,
    credentials: true,
  });

  app.use(
    rateLimitMiddleware,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.use((_: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader(
      'X-Content-Type-Options',
      'nosniff',
    );
    res.setHeader(
      'X-Frame-Options',
      'DENY',
    );
    res.setHeader(
      'Referrer-Policy',
      'no-referrer',
    );
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

  // Legacy local uploads only. New product images use Cloudinary.
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      maxAge: '1d',
      fallthrough: true,
    }),
  );

  app.enableShutdownHooks();

  const server = await app.listen(process.env.PORT || 3000);

  // Avoid needless reconnects behind Render/reverse proxies.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

void bootstrap();
