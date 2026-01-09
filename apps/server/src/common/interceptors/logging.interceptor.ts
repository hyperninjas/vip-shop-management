import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';
    const startTime = Date.now();

    // Request ID should already be set by RequestIdMiddleware
    // If not present, log a warning but don't generate one (to avoid conflicts)
    if (requestId === 'unknown') {
      this.logger.warn(
        `Request ID not found for ${method} ${url}. Ensure RequestIdMiddleware is applied.`,
      );
    }

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent} - RequestId: ${requestId}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          this.logger.log(
            `Outgoing Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - RequestId: ${requestId}`,
          );

          // Log slow requests
          if (duration > 1000) {
            this.logger.warn(
              `Slow Request Detected: ${method} ${url} - Duration: ${duration}ms - RequestId: ${requestId}`,
            );
          }
        },
        error: (error: unknown) => {
          const duration = Date.now() - startTime;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Request Failed: ${method} ${url} - Duration: ${duration}ms - Error: ${errorMessage} - RequestId: ${requestId}`,
          );
        },
      }),
    );
  }
}
