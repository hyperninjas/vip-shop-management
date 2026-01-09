import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { mkdirSync, writeFileSync } from 'fs';
import helmet from 'helmet';
import path from 'path';
import { AppModule } from './app.module';
import {
  CorsConfiguration,
  OpenapiConfiguration,
} from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // Enable body parser for proper request handling
    logger: ['log', 'error', 'warn', 'debug', 'fatal'],
    bufferLogs: true, // Buffer logs until logger is ready
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;
  const env = configService.get<string>('env')!;
  const isDev = env === 'development';
  const corsConfig = configService.get<CorsConfiguration>('cors')!;
  const openapiConfig = configService.get<OpenapiConfiguration>('openapi')!;

  // Enable compression for all environments (better performance)
  app.use(
    compression({
      level: 6, // Compression level (1-9)
      threshold: 1024, // Only compress responses larger than 1KB
    }),
  );
  // Enhanced security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: isDev
          ? {
              'default-src': ["'self'", 'https://cdn.jsdelivr.net'],
              'script-src': [
                "'self'",
                "'unsafe-inline'",
                "'wasm-unsafe-eval'",
                "'unsafe-eval'",
                'https://cdn.jsdelivr.net',
              ],
              'connect-src': [
                "'self'",
                'https://cdn.jsdelivr.net',
                'http://localhost:3000',
              ],
            }
          : {
              'default-src': ["'self'"],
              'script-src': ["'self'"],
              'connect-src': ["'self'"],
            },
      },
      crossOriginEmbedderPolicy: !isDev,
      crossOriginOpenerPolicy: !isDev,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.enableCors({
    origin: corsConfig.origins,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipMissingProperties: false,
      skipUndefinedProperties: true,
      stopAtFirstError: false,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  if (openapiConfig.enabled && isDev) {
    const config = new DocumentBuilder()
      .setTitle(openapiConfig.title)
      .setDescription(openapiConfig.description)
      .setVersion(openapiConfig.version)
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    // Generate and save OpenAPI JSON
    try {
      const document = documentFactory();
      const jsonDoc = JSON.stringify(document, null, 2);
      const filename = openapiConfig.filename;

      // Resolve path from dist folder to client openapi directory
      // apps/server/dist -> ../../client/openapi
      const clientOutDir = path.resolve(__dirname, '../../client/openapi');
      mkdirSync(clientOutDir, { recursive: true });
      const clientOutFile = path.join(clientOutDir, filename);
      writeFileSync(clientOutFile, jsonDoc, 'utf8');
      Logger.debug(`OpenAPI JSON written to ${clientOutFile}`);
    } catch (error) {
      Logger.error('Failed to generate OpenAPI JSON', error);
    }
  }

  app.setGlobalPrefix('api');

  // Graceful shutdown
  const gracefulShutdown = async (signal: string): Promise<void> => {
    Logger.warn(`Received ${signal}, starting graceful shutdown...`);
    try {
      await app.close();
      Logger.log('Application closed successfully');
      process.exit(0);
    } catch (error) {
      Logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', error);
    void gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection', { reason, promise });
    void gracefulShutdown('unhandledRejection');
  });

  await app.listen(port);
  Logger.log(`🚀 Server started on http://localhost:${port}`);
  Logger.log(
    `📚 OpenAPI documentation available at http://localhost:${port}/api`,
  );
  Logger.log(
    `🏥 Health check available at http://localhost:${port}/api/health`,
  );
  Logger.log(`🌍 Environment: ${env}`);
}
bootstrap().catch((err) => {
  Logger.error('Failed to start application', err);
  process.exit(1);
});
