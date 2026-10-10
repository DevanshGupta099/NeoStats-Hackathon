import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@forgeline/shared';

/**
 * Extracts and validates entity version from body or If-Match header.
 */
export function extractVersion(bodyVersion?: number, ifMatchHeader?: string): number {
  if (typeof bodyVersion === 'number' && !isNaN(bodyVersion) && bodyVersion > 0) {
    return bodyVersion;
  }

  if (ifMatchHeader) {
    const cleaned = ifMatchHeader.replace(/"/g, '').trim();
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  throw new BadRequestException({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Entity version is required for optimistic concurrency control (via body version or If-Match header)',
  });
}
