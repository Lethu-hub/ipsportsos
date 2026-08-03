import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormMessageProps {
  type: 'error' | 'success';
  children: React.ReactNode;
  className?: string;
}

function FormMessage({ type, children, className }: FormMessageProps) {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
        isError
          ? 'border-error/30 bg-error/10 text-error'
          : 'border-success/30 bg-success/10 text-success',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export { FormMessage };
