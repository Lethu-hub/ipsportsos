import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays } from 'lucide-react';

export const metadata = {
  title: 'Fixtures — IP Sports OS',
};

export default async function FixturesPage() {
  const supabase = await createClient();

  const { data: fixtures } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(name, organizations(name)), away_team:away_team_id(name, organizations(name))')
    .eq('status', 'UPCOMING')
    .order('match_date', { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader title="Fixtures" description="Upcoming matches across the league." className="mb-8" />
      {fixtures && fixtures.length > 0 ? (
        <div className="space-y-2">
          {fixtures.map((fixture) => {
            const home = fixture.home_team as unknown as { name: string; organizations: { name: string } | null } | null;
            const away = fixture.away_team as unknown as { name: string; organizations: { name: string } | null } | null;
            return (
              <div key={fixture.id} className="flex flex-col gap-1 rounded-lg border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {home?.organizations?.name ?? 'Club'} vs {away?.organizations?.name ?? 'Club'}
                  </p>
                  <p className="font-semibold">
                    {home?.name ?? 'Home'} <span className="text-muted-foreground">vs</span> {away?.name ?? 'Away'}
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(fixture.match_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  {fixture.venue ? ` · ${fixture.venue}` : ''}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No upcoming fixtures" description="Fixtures will appear here once the league season kicks off." />
      )}
    </div>
  );
}
