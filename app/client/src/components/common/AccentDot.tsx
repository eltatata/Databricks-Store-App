import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AccentDotProps {
  layoutId?: string;
  className?: string;
}

const GLIDE = { type: 'spring', stiffness: 520, damping: 38, mass: 0.6 } as const;

export function AccentDot({ layoutId, className }: AccentDotProps) {
  return (
    <motion.span
      aria-hidden
      layoutId={layoutId}
      transition={GLIDE}
      className={cn('inline-block size-2 shrink-0 rounded-full bg-brand', className)}
    />
  );
}
