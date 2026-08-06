import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserForm } from '@/components/portal/admin/user-form';
import { ShieldCheck, Users, Key } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [usersResult, orgsResult, rolesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, username, first_name, last_name, status, organization_memberships(role_id, status)')
      .order('email'),
    supabase.from('organizations').select('id, name').eq('status', 'ACTIVE').order('name'),
    supabase.from('roles').select('id, name, scope, description').order('scope').order('name'),
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

  const users = usersResult.data ?? [];
  const roles = rolesResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Create OS admins, staff users, and manage access permissions."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>All accounts with access to the platform ({users.length} total).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User / Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Memberships & Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userMemberships = membershipByProfile.get(user.id) ?? [];
                  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">
                          {fullName || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{user.email}</span>
                          {user.username ? (
                            <span className="font-mono text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              @{user.username}
                            </span>
                          ) : null}
                        </p>
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
                              const isPlatform = !orgName;
                              return (
                                <Badge key={m.id} variant={isPlatform ? 'default' : 'outline'}>
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
            <CardTitle>Create staff/admin user</CardTitle>
            <CardDescription>Add an OS Admin or a user with a role in an organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm
              organizations={orgsResult.data ?? []}
              roles={roles.map((r) => ({ name: r.name, scope: r.scope }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* System Roles & Permissions Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Software Roles & Permissions Matrix
          </CardTitle>
          <CardDescription>
            Reference guide for platform-level and organization-level authority.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    {r.scope === 'PLATFORM' ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                    {r.name.replaceAll('_', ' ')}
                  </span>
                  <Badge variant={r.scope === 'PLATFORM' ? 'default' : 'outline'} className="text-[10px]">
                    {r.scope.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.description || 'System defined role'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
