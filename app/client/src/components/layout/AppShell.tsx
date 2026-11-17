import { Outlet, useMatches } from 'react-router';
import type { RouteHandle } from '@/configs/routes';
import { cn } from '@/lib/utils';
import { TopBar } from './TopBar';

export function AppShell() {
  const matches = useMatches();
  const isViewport = matches.some((match) => (match.handle as RouteHandle | undefined)?.layout === 'viewport');

  return (
    <div className={cn(isViewport ? 'relative flex h-dvh flex-col overflow-hidden' : 'min-h-dvh')}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-ground"
      >
        Skip to content
      </a>
      <TopBar />
      <main
        id="main"
        className={cn(
          isViewport
            ? 'flex min-h-0 w-full flex-1 flex-col pt-8'
            : 'mx-auto max-w-[1440px] px-4 pt-8 pb-16 sm:px-6 lg:px-10'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
