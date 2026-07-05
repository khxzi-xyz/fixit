import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './modules/realtime/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors();
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // WebSocket scaling via Redis pub/sub (PRD §3.A). No-op without REDIS_URL.
  const wsAdapter = new RedisIoAdapter(app, process.env.REDIS_URL);
  await wsAdapter.connect();
  app.useWebSocketAdapter(wsAdapter);

  app.setGlobalPrefix('api');
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`FixIt Now backend listening on http://localhost:${port}/api`);
}

bootstrap();
