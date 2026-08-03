import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SportForm } from '@/components/portal/admin/sport-form';

export const dynamic = 'force-dynamic';

export default async function AdminSportsPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: sports } = await supabase.from('sports').select('*').order('name');

  return (
    <div className="space-y-6">
      <PageHeader title="Sports" description="Supported sports on the platform." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All sports</CardTitle>
            <CardDescription>Sports available to organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sports ?? []).map((sport) => (
                  <TableRow key={sport.id}>
                    <TableCell className="font-medium">{sport.name}</TableCell>
                    <TableCell>{sport.code}</TableCell>
                    <TableCell>
                      {sport.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create sport</CardTitle>
            <CardDescription>Add a new supported sport.</CardDescription>
          </CardHeader>
          <CardContent>
            <SportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
