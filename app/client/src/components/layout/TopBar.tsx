import { BookOpenText } from 'lucide-react';
import { NavLink } from 'react-router';
import { SignalDot } from '@/components/common/SignalDot';
import { FreshnessLabel } from '@/components/layout/FreshnessLabel';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { API_DOCS_URL, NAVIGATION } from '@/configs/routes';
import { cn } from '@/lib/utils';

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-ground/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-10 px-6 lg:px-10">
        <NavLink to="/" className="flex items-baseline gap-1.5 rounded-sm text-[15px] font-bold font-wide">
          Olist Store
          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
        </NavLink>

        <nav aria-label="Main" className="flex h-full items-stretch gap-7">
          {NAVIGATION.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center text-sm transition-colors duration-200',
                  isActive ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? <SignalDot layoutId="nav-signal" className="absolute -bottom-px left-1/2 -ml-1" /> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
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
