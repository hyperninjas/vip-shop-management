import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  requestId?: string;
  stack?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    let status: number;
    let message: string | string[];
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || exception.name;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
      error = exception.name;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'UnknownError';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(error && { error }),
      ...(requestId && { requestId }),
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && {
          stack: exception.stack,
        }),
    };

    // Log error with context
    interface RequestWithUser extends Request {
      user?: { id: string };
    }
    const requestWithUser = request as RequestWithUser;
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      requestId,
      userId: requestWithUser.user?.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    const messageStr = Array.isArray(message) ? message.join(', ') : message;
    const errorStack =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${messageStr}`,
        errorStack,
        'HttpExceptionFilter',
      );
      this.logger.debug('Error context', logContext);
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${messageStr}`,
        'HttpExceptionFilter',
      );
      this.logger.debug('Warning context', logContext);
    }

    response.status(status).json(errorResponse);
  }
}
