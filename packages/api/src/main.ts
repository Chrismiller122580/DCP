import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as Sentry from '@sentry/node'; // Stub for observability - init with DSN in prod env
Sentry.init({
  dsn: process.env.SENTRY_DSN || '', // Add SENTRY_DSN for production error tracking
  tracesSampleRate: 1.0,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.app\.github\.dev$/,
      'http://localhost:3000',
      'http://localhost:8081',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Admin-Key'],
  });

  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Rate limiting via ThrottlerModule (100/min); global guard can be enabled post-install: app.useGlobalGuards(new ThrottlerGuard());

  // OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('DCP API')
    .setDescription('XRPL-first crypto payment gateway public API')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addApiKey({ type: 'apiKey', name: 'X-Admin-Key', in: 'header' }, 'admin-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`DCP API listening on http://0.0.0.0:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
}
bootstrap();
