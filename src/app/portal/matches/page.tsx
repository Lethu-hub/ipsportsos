import { requirePortalUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { Match } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function PortalMatchesPage() {
  const session = await requirePortalUser();
  const supabase = await createClient();
  const org = session.access.find((m) => m.organization_id !== null);

  let matches: Array<
    Match & {
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    }
  > = [];

  if (org?.organization_id) {
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(name), away_team:away_team_id(name)')
      .eq('organization_id', org.organization_id)
      .order('match_date', { ascending: false })
      .limit(20);
    matches = (data ?? []) as unknown as typeof matches;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Matches" description="Fixtures and results for your club." />
      {!org || matches.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="No matches yet"
          description="Fixtures and results will appear here once matches are scheduled."
          action={
            <Link href="/portal/squad" className={buttonVariants()}>
              Manage squad first
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border">
            {matches.map((match) => {
              const home = match.home_team;
              const away = match.away_team;
              const isFinished = match.status === 'FINISHED';
              return (
                <div key={match.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm font-medium">
                    {home?.name ?? 'Home'} vs {away?.name ?? 'Away'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isFinished && match.home_score !== null
                      ? `${match.home_score} – ${match.away_score ?? 0}`
                      : new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {match.status.toLowerCase()}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
