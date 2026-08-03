import { requirePortalUser, primaryOrgMembership, hasPermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SquadManager } from '@/components/portal/squad-manager';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SquadPage() {
  const session = await requirePortalUser();
  const supabase = await createClient();
  const org = primaryOrgMembership(session.access);

  if (!org?.organization_id) {
    return (
      <div className="space-y-6">
        <PageHeader title="Squad" description="Manage teams and athletes." />
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No organization yet"
          description="You need to be a member of a club to manage a squad. Ask your platform administrator to add you."
          action={
            <Link href="/portal/admin/organizations" className={buttonVariants()}>
              Browse organizations
            </Link>
          }
        />
      </div>
    );
  }

  const canManage =
    hasPermission(session.access, org.organization_id, 'teams:create') ||
    hasPermission(session.access, org.organization_id, 'athletes:create') ||
    hasPermission(session.access, org.organization_id, 'athletes:publish');

  const [teamsResult, orgResult] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .eq('organization_id', org.organization_id)
      .eq('is_active', true)
      .order('name'),
    supabase.from('organizations').select('sport_id').eq('id', org.organization_id).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad"
        description={`Manage the squads of ${org.organization_name ?? 'your club'}.`}
      />
      <SquadManager
        organizationId={org.organization_id}
        initialTeams={teamsResult.data ?? []}
        sportId={orgResult.data?.sport_id ?? null}
        canManage={canManage}
      />
    </div>
  );
}
