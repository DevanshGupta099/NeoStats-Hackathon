'use client';

import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiClientError } from './api-client';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError && (error.status === 401 || error.status === 403 || error.status === 404)) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        onError: (error) => {
          if (error instanceof ApiClientError) {
            if (error.status === 403) {
              toast.error('ACCESS RESTRICTED', {
                description: error.message || 'You lack authorization for this operation.',
              });
            } else if (error.status === 409) {
              toast.error('CONCURRENCY CONFLICT (HTTP 409)', {
                description: 'This record was modified by another user. Reloading latest version.',
              });
            } else {
              toast.error('OPERATION FAILED', {
                description: error.message,
              });
            }
          }
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
