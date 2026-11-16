import { BookOpenText } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { AccentDot } from '@/components/common/AccentDot';
import { FreshnessLabel } from '@/components/layout/FreshnessLabel';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { API_DOCS_URL, NAVIGATION } from '@/configs/routes';
import { cn } from '@/lib/utils';

export function TopBar() {
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-ground/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:gap-10 sm:px-6 lg:px-10">
        <NavLink
          to="/"
          aria-label="Olist Store home"
          className="flex shrink-0 items-baseline gap-1 rounded-sm whitespace-nowrap"
        >
          <span className="text-[22px] leading-none font-extrabold tracking-[-0.05em] text-brand">olist</span>
          <span className="text-sm font-medium text-ink-2">store</span>
        </NavLink>

        <nav
          ref={navRef}
          aria-label="Main"
          className="flex h-full min-w-0 items-stretch gap-5 overflow-x-auto [scrollbar-width:none] sm:gap-7"
        >
          {NAVIGATION.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex shrink-0 items-center text-sm whitespace-nowrap transition-colors duration-200',
                  isActive ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? <AccentDot layoutId="nav-signal" className="absolute -bottom-px left-1/2 -ml-1" /> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-4 md:flex">
          <FreshnessLabel />
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={API_DOCS_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Open the API documentation"
                className="grid size-9 place-items-center rounded-md text-ink-3 transition-colors hover:bg-raised-2 hover:text-ink"
              >
                <BookOpenText className="size-4" strokeWidth={1.75} />
              </a>
            </TooltipTrigger>
            <TooltipContent>API documentation</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
