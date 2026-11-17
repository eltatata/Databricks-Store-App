import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './http';

const MAX_RETRIES = 2;
const DEFAULT_STALE_TIME_MS = 60_000;

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < MAX_RETRIES;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
