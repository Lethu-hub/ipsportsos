import { requirePortalUser, hasPermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SquadManager } from '@/components/portal/squad-manager';
import { PageHeader } from '@/components/ui/page-header';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SquadPageProps {
  params: { clubname: string };
}

export default async function ClubSquadPage({ params }: SquadPageProps) {
  const session = await requirePortalUser();
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

  const canManage =
    hasPermission(session.access, org.id, 'teams:create') ||
    hasPermission(session.access, org.id, 'athletes:create') ||
    hasPermission(session.access, org.id, 'athletes:publish');

  const [teamsResult] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('name'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad"
        description={`Manage the squads of ${org.name}.`}
      />
      <SquadManager
        organizationId={org.id}
        initialTeams={teamsResult.data ?? []}
        sportId={org.sport_id}
        canManage={canManage}
      />
    </div>
  );
}
