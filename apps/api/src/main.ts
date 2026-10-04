import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { env } from './config.js';
import { AppModule } from './app.module.js';
import type { Request, Response, NextFunction } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: env.WEB_ORIGIN,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    },
    bodyParser: true,
  });
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method !== 'GET' &&
      req.method !== 'OPTIONS' &&
      req.headers.origin &&
      req.headers.origin !== env.WEB_ORIGIN
    ) {
      res
        .status(403)
        .json({ message: 'This request origin is not permitted.' });
      return;
    }
    next();
  });
  const express = app.getHttpAdapter().getInstance();
  express.set('trust proxy', env.TRUST_PROXY === 'true' ? 1 : false);
  app.enableShutdownHooks();
  await app.listen(env.PORT, '127.0.0.1');
}
bootstrap().catch((error: unknown) => {
  console.error(
    'API startup failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
});
