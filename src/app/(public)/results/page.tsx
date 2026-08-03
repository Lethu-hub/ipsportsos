import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Trophy } from 'lucide-react';

export const metadata = {
  title: 'Results — IP Sports OS',
};

export default async function ResultsPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(name, organizations(name)), away_team:away_team_id(name, organizations(name))')
    .eq('status', 'FINISHED')
    .order('match_date', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader title="Results" description="Latest match results." className="mb-8" />
      {matches && matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((match) => {
            const home = match.home_team as unknown as { name: string; organizations: { name: string } | null } | null;
            const away = match.away_team as unknown as { name: string; organizations: { name: string } | null } | null;
            return (
              <div key={match.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {home?.organizations?.name ?? 'Club'} vs {away?.organizations?.name ?? 'Club'}
                  </p>
                  <p className="font-semibold">
                    {home?.name ?? 'Home'} vs {away?.name ?? 'Away'}
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-lg font-bold">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  {match.home_score ?? 0} – {match.away_score ?? 0}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No results yet" description="Finished matches will appear here." />
      )}
    </div>
  );
}
