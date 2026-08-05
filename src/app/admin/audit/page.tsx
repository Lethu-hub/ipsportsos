import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollText } from 'lucide-react';
import type { AuditLog } from '@/types/database';

export const dynamic = 'force-dynamic';

const ACTION_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  PUBLISH: 'success',
  LOGIN: 'info',
};

function readable(value: string) {
  return value.replaceAll('_', ' ').replaceAll('-', ' ').toLowerCase();
}

function actorName(actor: { email: string; first_name: string | null; last_name: string | null } | undefined) {
  if (!actor) return 'System';
  return [actor.first_name, actor.last_name].filter(Boolean).join(' ') || actor.email;
}

export default async function AdminAuditPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const auditLogs = (logs ?? []) as AuditLog[];
  const actorIds = [...new Set(auditLogs.map((log) => log.actor_profile_id).filter((id): id is string => Boolean(id)))];
  const organizationIds = [
    ...new Set(auditLogs.map((log) => log.organization_id).filter((id): id is string => Boolean(id))),
  ];

  const [actorsResult, organizationsResult] = await Promise.all([
    actorIds.length > 0
      ? supabase.from('profiles').select('id, email, first_name, last_name').in('id', actorIds)
      : Promise.resolve({ data: [] }),
    organizationIds.length > 0
      ? supabase.from('organizations').select('id, name').in('id', organizationIds)
      : Promise.resolve({ data: [] }),
  ]);

  const actors = new Map((actorsResult.data ?? []).map((actor) => [actor.id, actor]));
  const organizations = new Map((organizationsResult.data ?? []).map((organization) => [organization.id, organization.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="A read-only record of important platform and organization changes."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Showing the latest 100 events. Audit records cannot be edited or deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-6 w-6" />}
              title="No audit events yet"
              description="Changes made through the platform will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm">
                      {actorName(log.actor_profile_id ? actors.get(log.actor_profile_id) : undefined)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[log.action] ?? 'muted'}>{log.action.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{readable(log.entity_type)}</span>
                      {log.entity_id ? <span className="block max-w-32 truncate text-xs text-muted-foreground">{log.entity_id}</span> : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.organization_id ? organizations.get(log.organization_id) ?? 'Organization' : 'Platform'}
                    </TableCell>
                    <TableCell className="max-w-56">
                      <code className="block truncate text-xs text-muted-foreground">
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
