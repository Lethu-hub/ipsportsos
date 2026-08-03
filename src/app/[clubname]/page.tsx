import Link from 'next/link';
import { ArrowRight, PlusCircle, Users, Trophy, Globe } from 'lucide-react';
import { requirePortalUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ClubDashboardProps {
  params: { clubname: string };
}

export default async function ClubDashboardPage({ params }: ClubDashboardProps) {
  const session = await requirePortalUser();
  const supabase = await createClient();

  // Fetch the organization corresponding to the slug in the URL parameter.
  const { data: org } = await supabase
    .from('organizations')
    .select('*, organization_branding(*)')
    .eq('slug', params.clubname)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!org) {
    notFound();
  }

  // Get current user's membership role for this organization.
  const userMembership = session.access.find((m) => m.organization_id === org.id);
  const userRole = userMembership ? userMembership.role.replaceAll('_', ' ').toLowerCase() : 'administrator';

  const [teamsResult, athletesResult, matchesResult, pagesResult] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
    supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
    supabase
      .from('matches')
      .select('id, status', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'UPCOMING'),
    supabase
      .from('website_pages')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'PUBLISHED'),
  ]);

  const quickActions = [
    { href: `/${org.slug}/squad`, label: 'Add Team / Athlete', icon: <PlusCircle className="h-4 w-4" /> },
    { href: `/${org.slug}/matches`, label: 'Fixtures', icon: <Trophy className="h-4 w-4" /> },
    { href: `/${org.slug}/website`, label: 'Manage Website', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard — ${org.name}`}
        description={`Logged in as ${userRole}. Manage squad, matches, branding, and news.`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Teams" value={teamsResult?.count ?? '0'} hint="Registered squads" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Athletes" value={athletesResult?.count ?? '0'} hint="In your squad" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Upcoming Fixtures" value={matchesResult?.count ?? '0'} hint="Next 7 days" icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Published Pages" value={pagesResult?.count ?? '0'} hint="Live on public site" icon={<Globe className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump straight into managing your club.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className={cn(buttonVariants({ variant: 'outline' }))}>
              {action.icon}
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold">{org.name}</h3>
            <Badge variant="outline">{org.organization_type}</Badge>
            <Badge variant="success">Subscription: {org.subscription_status}</Badge>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            Your public website page:{' '}
            <Link href={`/clubs/${org.slug}`} className="font-medium text-primary hover:underline">
              /clubs/{org.slug}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
