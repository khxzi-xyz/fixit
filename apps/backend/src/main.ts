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

  // Handle deep links for app invites outside the /api prefix
  // Must be registered after NestJS setup to work correctly
  const expressApp = app.getHttpAdapter().getInstance();
  const inviteHandler = (req: any, res: any) => {
    const code = req.params.code;
    const deepLink = `fixit://invite/${code}`;
    const fallbackUrl = `https://fixit-now.xyz`;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FixIt Now Invite</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: #fff; margin: 0; }
          .container { text-align: center; padding: 2rem; }
          .logo { width: 80px; height: 80px; border-radius: 20px; margin-bottom: 1.5rem; }
          h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .code { background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 999px; font-family: monospace; margin: 1rem 0; display: inline-block; }
          .btn { display: inline-block; background: #1B6EF3; color: white; padding: 1rem 2.5rem; border-radius: 9999px; text-decoration: none; font-weight: bold; margin-top: 1rem; font-size: 1rem; }
          .sub { color: #888; font-size: 0.85rem; margin-top: 1.5rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎉 You've been invited to FixIt Now!</h2>
          <p>Use code:</p>
          <div class="code">${code}</div>
          <br/>
          <a href="${deepLink}" class="btn">Open FixIt Now App</a>
          <p class="sub">If the app doesn't open, download it from the store first.</p>
        </div>
        <script>
          window.location.href = "${deepLink}";
          setTimeout(() => {
            if (document.hasFocus()) {
              window.location.href = "${fallbackUrl}";
            }
          }, 3000);
        </script>
      </body>
      </html>
    `);
  };
  expressApp.get('/invite/:code', inviteHandler);
  expressApp.get('/api/invite/:code', inviteHandler);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`FixIt Now backend listening on http://localhost:${port}/api`);
}

bootstrap();
