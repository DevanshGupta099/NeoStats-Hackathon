import { PipeTransform, Injectable, ArgumentMetadata, HttpException, HttpStatus } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCode } from '@forgeline/shared';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of (result.error as ZodError).issues) {
        const path = issue.path.join('.') || 'value';
        fieldErrors[path] = issue.message;
      }

      throw new HttpException(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed for request payload',
          details: {
            fields: fieldErrors,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY, // 422
      );
    }

    return result.data;
  }
}
