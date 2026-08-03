import Link from 'next/link';
import { ArrowRight, ShieldCheck, Building2, UserCog, ChartBar as BarChart3 } from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [sportsResult, orgsResult, usersResult] = await Promise.all([
    supabase.from('sports').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const quickActions = [
    { href: '/admin/sports', label: 'Manage Sports', description: 'Add and configure supported sports.', icon: <ShieldCheck className="h-5 w-5 text-primary" /> },
    { href: '/admin/organizations', label: 'Manage Organizations', description: 'Add clubs, leagues, and subscriptions.', icon: <Building2 className="h-5 w-5 text-primary" /> },
    { href: '/admin/users', label: 'Manage Users & Admins', description: 'Add other OS admins and staff.', icon: <UserCog className="h-5 w-5 text-primary" /> },
    { href: '/admin/analytics', label: 'Analytics Engine', description: 'View system health and subscription analytics.', icon: <BarChart3 className="h-5 w-5 text-primary" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Centre"
        description="Global system administration for the IP Sports OS platform."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Sports" value={sportsResult?.count ?? '0'} hint="Configured on platform" icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Total Organizations" value={orgsResult?.count ?? '0'} hint="Clubs, leagues & partners" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Registered Users" value={usersResult?.count ?? '0'} hint="Active system accounts" icon={<UserCog className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Management Console</CardTitle>
          <CardDescription>Select a workspace to manage resources.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground flex items-center gap-1">
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
