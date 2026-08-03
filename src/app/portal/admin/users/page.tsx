import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserForm } from '@/components/portal/admin/user-form';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [usersResult, orgsResult, rolesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name, status, organization_memberships(role_id, status)')
      .order('email'),
    supabase.from('organizations').select('id, name').eq('status', 'ACTIVE').order('name'),
    supabase.from('roles').select('name, scope').order('scope').order('name'),
  ]);

  const memberships = await supabase
    .from('organization_memberships')
    .select('id, profile_id, organization_id, status, organizations(name), roles(name)');

  const membershipByProfile = new Map<string, typeof memberships.data>();
  for (const m of memberships.data ?? []) {
    const list = membershipByProfile.get(m.profile_id) ?? [];
    list.push(m);
    membershipByProfile.set(m.profile_id, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Create staff users and manage memberships."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Everyone with a profile on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Memberships</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersResult.data ?? []).map((user) => {
                  const userMemberships = membershipByProfile.get(user.id) ?? [];
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">
                          {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'INVITED' ? 'warning' : 'danger'}>
                          {user.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userMemberships.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {userMemberships.map((m) => {
                              const orgName = (m.organizations as { name: string } | null)?.name;
                              const roleName = (m.roles as { name: string } | null)?.name;
                              return (
                                <Badge key={m.id} variant="outline">
                                  {orgName ?? 'Platform'} · {roleName?.replaceAll('_', ' ')}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create staff user</CardTitle>
            <CardDescription>Add a user with a role in an organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm organizations={orgsResult.data ?? []} roles={rolesResult.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
