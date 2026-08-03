import Link from 'next/link';
import { ArrowRight, PlusCircle, Users, Trophy, Globe, ShieldCheck, Building2, UserCog } from 'lucide-react';
import { requirePortalUser, isPlatformAdmin, primaryOrgMembership } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PortalDashboardPage() {
  const session = await requirePortalUser();
  const supabase = await createClient();
  const platformAdmin = isPlatformAdmin(session.access);
  const org = primaryOrgMembership(session.access);

  const profile = session.profile;
  const firstName = profile?.first_name ?? session.email.split('@')[0] ?? 'there';

  const [teamsResult, athletesResult, matchesResult, pagesResult, brandingResult] = await Promise.all([
    org?.organization_id ? supabase.from('teams').select('id', { count: 'exact', head: true }).eq('organization_id', org.organization_id) : null,
    org?.organization_id ? supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('organization_id', org.organization_id) : null,
    org?.organization_id
      ? supabase
          .from('matches')
          .select('id, status', { count: 'exact', head: true })
          .eq('organization_id', org.organization_id)
          .eq('status', 'UPCOMING')
      : null,
    org?.organization_id
      ? supabase
          .from('website_pages')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.organization_id)
          .eq('status', 'PUBLISHED')
      : null,
    org?.organization_id
      ? supabase
          .from('organization_branding')
          .select('*')
          .eq('organization_id', org.organization_id)
          .maybeSingle()
      : null,
  ]);

  const quickActions = platformAdmin
    ? [
        { href: '/portal/admin/sports', label: 'New Sport', icon: <ShieldCheck className="h-4 w-4" /> },
        { href: '/portal/admin/organizations', label: 'New League / Club', icon: <Building2 className="h-4 w-4" /> },
        { href: '/portal/admin/users', label: 'New Staff User', icon: <UserCog className="h-4 w-4" /> },
      ]
    : org
      ? [
          { href: '/portal/squad', label: 'Add Team / Athlete', icon: <PlusCircle className="h-4 w-4" /> },
          { href: '/portal/matches', label: 'Fixtures', icon: <Trophy className="h-4 w-4" /> },
          { href: '/portal/website', label: 'Manage Website', icon: <Globe className="h-4 w-4" /> },
        ]
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          platformAdmin
            ? 'Platform control centre — manage sports, organisations, and staff.'
            : org
              ? `Managing ${org.organization_name ?? 'your organisation'} as ${org.role.replaceAll('_', ' ').toLowerCase()}.`
              : 'You do not have an organisation yet.'
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Teams" value={teamsResult?.count ?? '—'} hint="Registered squads" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Athletes" value={athletesResult?.count ?? '—'} hint="In your squad" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Upcoming Fixtures" value={matchesResult?.count ?? '—'} hint="Next 7 days" icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Published Pages" value={pagesResult?.count ?? '—'} hint="Live on public site" icon={<Globe className="h-4 w-4" />} />
      </div>

      {quickActions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump straight into the work that matters.</CardDescription>
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
      ) : null}

      {org ? (
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold">{org.organization_name}</h3>
              <Badge variant="outline">{org.organization_type}</Badge>
              <Badge variant="success">Role: {org.role.replaceAll('_', ' ')}</Badge>
            </div>
            {brandingResult?.data ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Brand colours:</span>
                {[brandingResult.data.primary_color, brandingResult.data.secondary_color, brandingResult.data.accent_color]
                  .filter(Boolean)
                  .map((color) => (
                    <span
                      key={color}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border"
                      style={{ backgroundColor: color ?? undefined }}
                      title={color ?? undefined}
                    >
                      <span className="sr-only">{color}</span>
                    </span>
                  ))}
              </div>
            ) : null}
            <Separator />
            <p className="text-sm text-muted-foreground">
              Your public page:{' '}
              <Link href={`/clubs/${org.organization_slug ?? ''}`} className="font-medium text-primary hover:underline">
                /clubs/{org.organization_slug}
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Sprint 1 demo flow</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Create a sport, league, and club from the Platform Admin area.</li>
            <li>Create a staff user and sign in as them.</li>
            <li>Add a team and athletes in the Squad area.</li>
            <li>Toggle an athlete&apos;s visibility to publish them to the public club page.</li>
          </ol>
          <Link href="/clubs" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
            View public site
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
