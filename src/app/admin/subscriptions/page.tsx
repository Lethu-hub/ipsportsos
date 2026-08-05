import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { SubscriptionManager } from '@/components/portal/admin/subscription-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [organizationsResult, plansResult, subscriptionsResult, entitlementsResult] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, organization_type, subscription_status')
      .order('name'),
    supabase.from('subscription_plans').select('*').order('name'),
    supabase.from('organization_subscriptions').select('*'),
    supabase.from('feature_entitlements').select('*'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions & access"
        description="Assign plans and configure feature entitlements for every organization."
      />
      <SubscriptionManager
        organizations={organizationsResult.data ?? []}
        plans={plansResult.data ?? []}
        subscriptions={subscriptionsResult.data ?? []}
        entitlements={entitlementsResult.data ?? []}
      />
    </div>
  );
}
