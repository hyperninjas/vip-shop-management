import { HttpModule } from '@nestjs/axios';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { auth } from './lib/auth';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.production'],
      load: [configuration],
      cache: true,
      isGlobal: true,
      validate: process.env.NODE_ENV !== 'test' ? validate : undefined,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    AuthModule.forRoot({
      auth,
      middleware: (req, _res, next) => {
        req.url = req.originalUrl;
        req.baseUrl = '';
        next();
      },
    }),
    CacheModule.register({
      ttl: 60 * 60 * 1000, // 1 hour
      max: 1000, // Increased cache size
      isGlobal: true,
      store: 'memory',
    }),
    HttpModule.register({
      timeout: 10000, // Increased timeout
      maxRedirects: 5,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
      errorMessage: 'Too many requests, please try again later.',
    }),
    TerminusModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
