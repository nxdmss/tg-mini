import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// === ТОЧНО СЮДА ДОБАВЛЯЕМ ИМПОРТЫ ДЛЯ СТАТИКИ ===
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // === ТОЧНО СЮДА ВСТАВЛЯЕМ СТРОЧКУ РАЗДАЧИ ПАПКИ UPLOADS ===
  // Она должна быть строго ПЕРЕД app.listen
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();