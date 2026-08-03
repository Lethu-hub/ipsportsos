import Link from 'next/link';
import { requirePortalUser, primaryOrgMembership } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

export default async function PortalSettingsPage() {
  const session = await requirePortalUser();
  const supabase = await createClient();
  const org = primaryOrgMembership(session.access);

  const [orgResult, brandingResult, subscriptionResult, planResult] = await Promise.all(
    org?.organization_id
      ? [
          supabase.from('organizations').select('*').eq('id', org.organization_id).maybeSingle(),
          supabase.from('organization_branding').select('*').eq('organization_id', org.organization_id).maybeSingle(),
          supabase.from('organization_subscriptions').select('*').eq('organization_id', org.organization_id).maybeSingle(),
          supabase.from('subscription_plans').select('*').maybeSingle(),
        ]
      : [null, null, null, null],
  );

  const data = orgResult?.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organization details and subscription." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Public identity of your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data ? (
              <>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{data.name}</h3>
                  <Badge variant="outline">{data.organization_type.toLowerCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Public page: <Link href={`/clubs/${data.slug}`} className="font-medium text-primary hover:underline">/clubs/{data.slug}</Link>
                </p>
                <Separator />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium">{data.status.toLowerCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Subscription</dt>
                    <dd className="font-medium">{data.subscription_status.toLowerCase()}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No organization membership yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & Plan</CardTitle>
            <CardDescription>Club identity and current subscription.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brandingResult?.data ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Colours:</span>
                {[brandingResult.data.primary_color, brandingResult.data.secondary_color, brandingResult.data.accent_color]
                  .filter(Boolean)
                  .map((color) => (
                    <span
                      key={color}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
                      style={{ backgroundColor: color ?? undefined }}
                      title={color ?? undefined}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No branding set yet.</p>
            )}
            <Separator />
            <p className="text-sm text-muted-foreground">
              Plan:{' '}
              <span className="font-medium text-foreground">
                {planResult?.data?.name ?? subscriptionResult?.data?.plan_id ?? '—'}
              </span>{' '}
              {subscriptionResult?.data ? (
                <Badge variant="success">{subscriptionResult.data.status.toLowerCase()}</Badge>
              ) : null}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
