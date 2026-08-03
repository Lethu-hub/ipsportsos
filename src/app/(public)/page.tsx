import Link from 'next/link';
import { Users, ChartBar as BarChart3, Globe, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ClubCard } from '@/components/public/club-card';

export const metadata = {
  title: 'IP Sports OS — The digital operating system for sports organisations',
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: clubs } = await supabase
    .from('organizations')
    .select('*, organization_branding(*)')
    .eq('organization_type', 'CLUB')
    .eq('status', 'ACTIVE')
    .order('name');

  const { data: fixtures } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(name, organizations(name)), away_team:away_team_id(name, organizations(name))')
    .eq('status', 'UPCOMING')
    .order('match_date', { ascending: true })
    .limit(4);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-success" />
              Beta — One Sport, One League, Three Clubs
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Your home for <span className="text-primary">football intelligence</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Discover clubs, follow fixtures, explore player cards, and dive into performance analytics — all in one
              platform built for the modern game.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/clubs"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Browse Clubs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/fixtures"
                className="inline-flex h-11 items-center rounded-md border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                View Fixtures
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured clubs */}
      {clubs && clubs.length > 0 ? (
        <section className="border-t border-border/60 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Featured Clubs</h2>
              <Link href="/clubs" className="text-sm font-medium text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.slice(0, 3).map((club) => (
                <ClubCard
                  key={club.id}
                  name={club.name}
                  slug={club.slug}
                  type={club.organization_type}
                  branding={
                    club.organization_branding ?? {
                      primary_color: null,
                      secondary_color: null,
                      accent_color: null,
                      logo_url: null,
                      banner_url: null,
                    }
                  }
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured fixtures */}
      {fixtures && fixtures.length > 0 ? (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Upcoming Fixtures</h2>
              <Link href="/fixtures" className="text-sm font-medium text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fixtures.map((fixture) => {
                const home = fixture.home_team as unknown as { name: string; organizations: { name: string } | null } | null;
                const away = fixture.away_team as unknown as { name: string; organizations: { name: string } | null } | null;
                return (
                  <div key={fixture.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {home?.organizations?.name ?? 'Club'} vs {away?.organizations?.name ?? 'Club'}
                    </p>
                    <p className="mt-1 font-semibold">
                      {home?.name ?? 'Home'} vs {away?.name ?? 'Away'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(fixture.match_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
                      {fixture.venue ? ` · ${fixture.venue}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Feature grid */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard icon={<Globe className="h-6 w-6" />} title="Public Portal" description="Fans discover clubs, fixtures, results, and player cards in a clean, fast interface." />
            <FeatureCard icon={<Users className="h-6 w-6" />} title="Club Portal" description="Staff manage squads, matches, and website content with a draft-to-publish workflow." />
            <FeatureCard icon={<BarChart3 className="h-6 w-6" />} title="Analytics Engine" description="Reusable widgets and role-aware dashboards turn match data into actionable insight." />
          </div>
        </div>
      </section>
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
