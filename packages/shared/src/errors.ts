export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

export interface VersionConflictDetails {
  current: Record<string, unknown>;
  yourVersion: number;
  currentVersion: number;
}
