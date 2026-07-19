import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const allowedDevOriginPattern =
  /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):3001$/;
const allowedConfiguredOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isAllowedOrigin(origin: string): boolean {
  return (
    allowedDevOriginPattern.test(origin) ||
    allowedConfiguredOrigins.includes(origin)
  );
}

function enforceTrustedOrigin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const origin = request.headers.origin;

  if (
    unsafeMethods.has(request.method) &&
    typeof origin === 'string' &&
    !isAllowedOrigin(origin)
  ) {
    response.status(403).send('Origin is not allowed.');
    return;
  }

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(enforceTrustedOrigin);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
