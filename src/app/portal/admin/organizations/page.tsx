import Link from 'next/link';
import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrganizationForm } from '@/components/portal/admin/organization-form';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationsPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [orgsResult, sportsResult] = await Promise.all([
    supabase.from('organizations').select('*').order('name'),
    supabase.from('sports').select('id, name').eq('is_active', true).order('name'),
  ]);

  const orgs = orgsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Clubs, leagues, academies, and associations on the platform."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All organizations</CardTitle>
            <CardDescription>Tenants of the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link href={`/clubs/${org.slug}`} className="font-medium text-primary hover:underline">
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell>{org.organization_type.toLowerCase()}</TableCell>
                    <TableCell>
                      <Badge variant={org.status === 'ACTIVE' ? 'success' : org.status === 'PAUSED' ? 'warning' : 'danger'}>
                        {org.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.subscription_status === 'ACTIVE' ? 'info' : 'muted'}>
                        {org.subscription_status.toLowerCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>A club, league, academy, or association.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationForm sports={sportsResult.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
