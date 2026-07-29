import Link from 'next/link';
import { Trophy, Users, BarChart3, Globe, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">IP Sports OS</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/fixtures" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Fixtures</Link>
            <Link href="/results" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Results</Link>
            <Link href="/clubs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Clubs</Link>
            <Link href="/news" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">News</Link>
          </div>
          <Link href="/portal" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Portal Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-success" />
              Beta — One Sport, One League, Three Clubs
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Your home for <span className="text-primary">football intelligence</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Discover clubs, follow fixtures, explore player cards, and dive into performance analytics — all in one platform built for the modern game.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/clubs" className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Browse Clubs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/fixtures" className="inline-flex h-11 items-center rounded-md border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted">
                View Fixtures
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard icon={<Globe className="h-6 w-6" />} title="Public Portal" description="Fans discover clubs, fixtures, results, and player cards in a clean, fast interface." />
            <FeatureCard icon={<Users className="h-6 w-6" />} title="Club Portal" description="Staff manage squads, matches, and website content with a draft-to-publish workflow." />
            <FeatureCard icon={<BarChart3 className="h-6 w-6" />} title="Analytics Engine" description="Reusable widgets and role-aware dashboards turn match data into actionable insight." />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">IP Sports OS — The digital operating system for sports organisations.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
