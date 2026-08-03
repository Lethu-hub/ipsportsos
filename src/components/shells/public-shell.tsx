import { PublicNav } from '@/components/shells/public-nav';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              IP Sports OS — The digital operating system for sports organisations.
            </p>
            <p className="text-xs text-muted-foreground">Beta — One Sport, One League, Three Clubs</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
