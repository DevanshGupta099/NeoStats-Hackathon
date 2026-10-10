import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ApiErrorResponse } from '@forgeline/shared';
import { RequestWithId } from '../middleware/request-id.middleware';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const requestId = String(request.requestId || request.id || (request.headers['x-request-id'] as string) || 'unknown');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected internal error occurred';
    let details: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;

        // Check if an explicit error envelope or code was already packaged
        if (resObj.error && typeof resObj.error === 'object') {
          const errChild = resObj.error as Record<string, unknown>;
          code = (errChild.code as string) || this.mapStatusToErrorCode(status);
          message = (errChild.message as string) || exception.message;
          details = (errChild.details as Record<string, unknown>) || {};
        } else {
          code = (resObj.code as string) || this.mapStatusToErrorCode(status);
          message = (resObj.message as string) || exception.message;
          details = (resObj.details as Record<string, unknown>) || {};

          // If message is an array (e.g., standard class-validator/nestjs format)
          if (Array.isArray(resObj.message)) {
            message = 'Validation failed';
            details.issues = resObj.message;
          }
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error on ${request.method} ${request.url}: ${exception.stack}`);
    }

    // Default code mapping if still unassigned
    if (!code || code === ErrorCode.INTERNAL_ERROR) {
      code = this.mapStatusToErrorCode(status);
    }

    const errorPayload: ApiErrorResponse = {
      error: {
        code,
        message,
        details: Object.keys(details).length > 0 ? details : undefined,
        requestId,
      },
    };

    response.status(status).json(errorPayload);
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.VERSION_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
