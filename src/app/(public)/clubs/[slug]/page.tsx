import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PlayerCard } from '@/components/public/player-card';
import type { Athlete, AthleteStatistics, AthleteVisibility, Team } from '@/types/database';

interface ClubPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export default async function ClubPage({ params }: ClubPageProps) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*, organization_branding(*)')
    .eq('slug', params.slug)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!org) notFound();

  const branding = org.organization_branding ?? null;

  const [teamsResult, athletesResult, fixturesResult, newsResult, sectionsResult] = await Promise.all([
    supabase.from('teams').select('*').eq('organization_id', org.id).eq('is_active', true).order('name'),
    supabase
      .from('athletes')
      .select('*, athlete_visibility(*), athlete_statistics(*)')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('shirt_number', { ascending: true, nullsFirst: false }),
    supabase
      .from('matches')
      .select('*, home_team:home_team_id(name), away_team:away_team_id(name)')
      .eq('organization_id', org.id)
      .order('match_date', { ascending: false })
      .limit(6),
    supabase
      .from('news_items')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'PUBLISHED')
      .eq('visibility', 'PUBLIC')
      .order('published_at', { ascending: false })
      .limit(3),
    supabase.from('club_page_sections').select('*').eq('organization_id', org.id).eq('enabled', true).order('display_order'),
  ]);

  const sections = new Set((sectionsResult.data ?? []).map((s) => s.section_type));
  const showSquad = sections.has('squad');
  const showNews = sections.has('news');

  const teams = (teamsResult.data ?? []) as Team[];
  const athletes = (athletesResult.data ?? []) as (Athlete & {
    athlete_visibility: AthleteVisibility | null;
    athlete_statistics: AthleteStatistics[];
  })[];

  const primaryColor = branding?.primary_color ?? '#2563eb';
  const secondaryColor = branding?.secondary_color ?? '#ffffff';

  return (
    <main>
      {/* Banner (visual.md §21 — club identity) */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 45%, ${secondaryColor} 130%)`,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/20 text-4xl font-bold text-card backdrop-blur-sm">
              {org.name.charAt(0)}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge className="border-0 bg-card/20 text-card backdrop-blur-sm">{org.organization_type.toLowerCase()}</Badge>
                {org.subscription_status === 'ACTIVE' ? (
                  <Badge className="border-0 bg-card/20 text-card backdrop-blur-sm">Verified</Badge>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-card md:text-4xl">{org.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-card/90">
            <MapPin className="h-4 w-4" />
            Botswana
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6">
        {/* Teams */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight">Teams</h2>
          {teams.length === 0 ? (
            <EmptyState title="No teams published yet" description="The club has not published any teams." />
          ) : (
            <div className="flex flex-wrap gap-3">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.category ?? 'Senior'} · {team.gender?.toLowerCase() ?? 'mixed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Squad roster */}
        {showSquad ? (
          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">Squad</h2>
            {athletes.length === 0 ? (
              <EmptyState title="Squad roster not published yet" description="Check back soon — the club is building its roster." />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {athletes.map((athlete) => (
                  <PlayerCard key={athlete.id} athlete={athlete} visibility={athlete.athlete_visibility} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* Fixtures & results */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight">Fixtures & Results</h2>
          {fixturesResult.data && fixturesResult.data.length > 0 ? (
            <div className="space-y-2">
              {fixturesResult.data.map((fixture) => {
                const home = fixture.home_team as unknown as { name: string } | null;
                const away = fixture.away_team as unknown as { name: string } | null;
                const finished = fixture.status === 'FINISHED';
                return (
                  <div key={fixture.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                    <p className="text-sm font-medium">
                      {home?.name ?? 'Home'} vs {away?.name ?? 'Away'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {finished && fixture.home_score !== null
                        ? `${fixture.home_score} – ${fixture.away_score ?? 0}`
                        : new Date(fixture.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No fixtures yet" description="Upcoming matches will be listed here." />
          )}
        </section>

        {/* News */}
        {showNews && newsResult.data && newsResult.data.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight">Latest News</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {newsResult.data.map((item) => (
                <article key={item.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.published_at ? new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : ''}
                  </p>
                  <h3 className="mt-1 font-semibold">{item.title}</h3>
                  {item.summary ? <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.summary}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          Visit the <Link href="/clubs" className="font-medium text-primary hover:underline">club directory</Link> to explore more clubs.
        </p>
      </div>
    </main>
  );
}
