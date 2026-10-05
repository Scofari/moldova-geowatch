import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import { env } from './config.js';
import { AppModule } from './app.module.js';
import type { Request, Response, NextFunction } from 'express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: env.WEB_ORIGIN,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    },
    bodyParser: true,
  });
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      // OSM tiles require a Referer; send only the origin across sites.
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", env.WEB_ORIGIN.replace(/^http/, 'ws')],
          upgradeInsecureRequests: env.WEB_ORIGIN.startsWith('https:')
            ? []
            : null,
        },
      },
    }),
  );
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
  if (env.SERVE_WEB === 'true') {
    const root = fileURLToPath(new URL('../../web/dist/', import.meta.url));
    await access(new URL('../../web/dist/index.html', import.meta.url));
    app.useStaticAssets(root, {
      dotfiles: 'deny',
      setHeaders: (res, path) => {
        res.setHeader(
          'Cache-Control',
          /[/\\]assets[/\\]/.test(path)
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
        );
      },
    });
  }
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
}
bootstrap().catch((error: unknown) => {
  console.error(
    'API startup failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
});
