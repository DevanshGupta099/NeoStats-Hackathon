import { ZodValidationPipe } from './zod-validation.pipe';
import { z } from 'zod';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@forgeline/shared';

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    name: z.string().min(3),
    count: z.number().positive(),
  });

  const pipe = new ZodValidationPipe(testSchema);

  it('should pass valid data through untouched', () => {
    const input = { name: 'ValidName', count: 10 };
    const result = pipe.transform(input, { type: 'body' });
    expect(result).toEqual(input);
  });

  it('should throw HttpException 422 with VALIDATION_ERROR code on invalid input', () => {
    const invalidInput = { name: 'ab', count: -5 };

    try {
      pipe.transform(invalidInput, { type: 'body' });
      fail('Expected pipe to throw');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(HttpException);
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

      const res = httpErr.getResponse() as Record<string, unknown>;
      expect(res.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(res.message).toBe('Validation failed for request payload');
      expect(res.details).toBeDefined();
    }
  });

  it('should bypass transformation for non-payload arguments', () => {
    const input = 'custom-param';
    const result = pipe.transform(input, { type: 'custom' });
    expect(result).toBe(input);
  });
});
