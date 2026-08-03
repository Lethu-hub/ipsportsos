import * as React from 'react';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { initials?: string }>(
  ({ className, initials, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    >
      {initials ? initials : null}
    </div>
  ),
);
Avatar.displayName = 'Avatar';

export { Avatar };
