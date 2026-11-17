import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

export const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });

const createWrapper = (queryClient: QueryClient, initialPath: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

export const renderWithProviders = (ui: ReactElement, initialPath = '/') => {
  const queryClient = createTestQueryClient();
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient, initialPath) }) };
};

export const renderHookWithProviders = <T,>(hook: () => T, initialPath = '/') => {
  const queryClient = createTestQueryClient();
  return { queryClient, ...renderHook(hook, { wrapper: createWrapper(queryClient, initialPath) }) };
};
