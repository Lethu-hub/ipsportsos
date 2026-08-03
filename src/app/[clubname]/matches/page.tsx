import { requirePortalUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Match } from '@/types/database';

export const dynamic = 'force-dynamic';

interface ClubMatchesProps {
  params: { clubname: string };
}

export default async function ClubMatchesPage({ params }: ClubMatchesProps) {
  await requirePortalUser();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.clubname)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!org) {
    notFound();
  }

  const { data } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(name), away_team:away_team_id(name)')
    .eq('organization_id', org.id)
    .order('match_date', { ascending: false })
    .limit(20);

  const matches = (data ?? []) as unknown as Array<
    Match & {
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    }
  >;

  return (
    <div className="space-y-6">
      <PageHeader title="Matches" description={`Fixtures and results for ${org.name}.`} />
      {matches.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="No matches yet"
          description="Fixtures and results will appear here once matches are scheduled."
          action={
            <Link href={`/${org.slug}/squad`} className={buttonVariants()}>
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
