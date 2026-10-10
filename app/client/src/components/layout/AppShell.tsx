import { Outlet } from 'react-router';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-ground"
      >
        Skip to content
      </a>
      <TopBar />
      <main id="main" className="mx-auto max-w-[1440px] px-6 pt-8 pb-16 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
