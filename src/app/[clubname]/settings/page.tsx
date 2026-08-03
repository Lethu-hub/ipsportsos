import Link from 'next/link';
import { requirePortalUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ClubSettingsProps {
  params: { clubname: string };
}

export default async function ClubSettingsPage({ params }: ClubSettingsProps) {
  await requirePortalUser();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.clubname)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!org) {
    notFound();
  }

  const [brandingResult, subscriptionResult, plansResult] = await Promise.all([
    supabase.from('organization_branding').select('*').eq('organization_id', org.id).maybeSingle(),
    supabase.from('organization_subscriptions').select('*').eq('organization_id', org.id).maybeSingle(),
    supabase.from('subscription_plans').select('*'),
  ]);

  const planId = subscriptionResult?.data?.plan_id;
  const plan = plansResult?.data?.find((p) => p.id === planId);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description={`Organization details and subscription for ${org.name}.`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Public identity of your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold">{org.name}</h3>
              <Badge variant="outline">{org.organization_type.toLowerCase()}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Public page:{' '}
              <Link href={`/clubs/${org.slug}`} className="font-medium text-primary hover:underline">
                /clubs/{org.slug}
              </Link>
            </p>
            <Separator />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">{org.status.toLowerCase()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Subscription</dt>
                <dd className="font-medium">{org.subscription_status.toLowerCase()}</dd>
              </div>
            </dl>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Plan:</span>
              <span className="font-medium text-foreground">{plan?.name ?? 'Starter'}</span>
              {subscriptionResult?.data ? (
                <Badge variant="success">{subscriptionResult.data.status.toLowerCase()}</Badge>
              ) : (
                <Badge variant="success">active</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
