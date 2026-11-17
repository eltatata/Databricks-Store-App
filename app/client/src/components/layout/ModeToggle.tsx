import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { THEME_OPTIONS } from '@/configs/theme';
import { useTheme } from '@/hooks/common/useTheme';
import type { Theme } from '@/types/theme.types';

function isTheme(value: string): value is Theme {
  return THEME_OPTIONS.some((option) => option.value === value);
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-ink-3 hover:text-ink">
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" strokeWidth={1.75} />
          <Moon
            className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
            strokeWidth={1.75}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => isTheme(value) && setTheme(value)}>
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
