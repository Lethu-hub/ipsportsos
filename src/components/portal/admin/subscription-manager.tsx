'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
  FeatureEntitlement,
  OrganizationSubscription,
  SubscriptionPlan,
} from '@/types/database';

interface OrganizationOption {
  id: string;
  name: string;
  organization_type: 'CLUB' | 'LEAGUE' | 'ACADEMY' | 'ASSOCIATION';
  subscription_status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
}

interface SubscriptionManagerProps {
  organizations: OrganizationOption[];
  plans: SubscriptionPlan[];
  subscriptions: OrganizationSubscription[];
  entitlements: FeatureEntitlement[];
}

type SubscriptionStatus = OrganizationSubscription['status'];

type FeatureDraft = {
  enabled: boolean;
  limitValue: string;
};

const FEATURE_CATALOG = [
  { key: 'website.publishing', label: 'Website publishing', description: 'Publish pages and news to the public site.' },
  { key: 'analytics.widgets', label: 'Analytics widgets', description: 'Use configurable performance dashboards.' },
  { key: 'squad.management', label: 'Squad management', description: 'Create teams and maintain athlete rosters.' },
  { key: 'matches.management', label: 'Match management', description: 'Create fixtures and record results.' },
] as const;

const DEFAULT_FEATURE_KEYS: Set<string> = new Set(FEATURE_CATALOG.map((feature) => feature.key));

export function SubscriptionManager({
  organizations,
  plans,
  subscriptions: initialSubscriptions,
  entitlements: initialEntitlements,
}: SubscriptionManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(organizations[0]?.id ?? '');
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [featureDrafts, setFeatureDrafts] = useState<Record<string, FeatureDraft>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;
  const selectedSubscription = subscriptions.find(
    (subscription) => subscription.organization_id === selectedOrganizationId,
  );
  const selectedEntitlements = useMemo(
    () => entitlements.filter((entitlement) => entitlement.organization_id === selectedOrganizationId),
    [entitlements, selectedOrganizationId],
  );
  const customFeatureKeys = Object.keys(featureDrafts).filter((key) => !DEFAULT_FEATURE_KEYS.has(key));

  useEffect(() => {
    setPlanId(selectedSubscription?.plan_id ?? plans[0]?.id ?? '');
    setStatus(selectedSubscription?.status ?? 'ACTIVE');
  }, [plans, selectedSubscription]);

  useEffect(() => {
    const drafts: Record<string, FeatureDraft> = {};
    for (const feature of FEATURE_CATALOG) {
      const existing = selectedEntitlements.find((entitlement) => entitlement.feature_key === feature.key);
      drafts[feature.key] = {
        enabled: existing?.enabled ?? false,
        limitValue: existing?.limit_value === null || existing?.limit_value === undefined ? '' : String(existing.limit_value),
      };
    }
    for (const entitlement of selectedEntitlements) {
      if (!DEFAULT_FEATURE_KEYS.has(entitlement.feature_key)) {
        drafts[entitlement.feature_key] = {
          enabled: entitlement.enabled,
          limitValue: entitlement.limit_value === null ? '' : String(entitlement.limit_value),
        };
      }
    }
    setFeatureDrafts(drafts);
  }, [selectedEntitlements]);

  async function saveSubscription(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrganizationId || !planId) return;

    setPendingKey('subscription');
    setMessage(null);

    const subscriptionPayload = {
      plan_id: planId,
      status,
      started_at: selectedSubscription?.started_at ?? new Date().toISOString(),
      auto_renew: selectedSubscription?.auto_renew ?? true,
    };

    const subscriptionResult = selectedSubscription
      ? await supabase
          .from('organization_subscriptions')
          .update(subscriptionPayload)
          .eq('id', selectedSubscription.id)
          .select()
          .single()
      : await supabase
          .from('organization_subscriptions')
          .insert({ organization_id: selectedOrganizationId, ...subscriptionPayload })
          .select()
          .single();

    if (subscriptionResult.error || !subscriptionResult.data) {
      setMessage({ type: 'error', text: subscriptionResult.error?.message ?? 'Could not save the subscription.' });
      setPendingKey(null);
      return;
    }

    const organizationStatus: OrganizationOption['subscription_status'] =
      status === 'ACTIVE' ? 'ACTIVE' : status === 'PENDING' ? 'PENDING' : 'EXPIRED';
    const organizationResult = await supabase
      .from('organizations')
      .update({ subscription_status: organizationStatus })
      .eq('id', selectedOrganizationId);

    if (organizationResult.error) {
      setMessage({
        type: 'error',
        text: `Subscription saved, but organization status could not be synchronized: ${organizationResult.error.message}`,
      });
      setPendingKey(null);
      return;
    }

    setSubscriptions((current) => [
      ...current.filter((subscription) => subscription.organization_id !== selectedOrganizationId),
      subscriptionResult.data,
    ]);
    setMessage({ type: 'success', text: `Subscription updated for ${selectedOrganization?.name ?? 'the organization'}.` });
    setPendingKey(null);
    router.refresh();
  }

  async function saveFeature(featureKey: string) {
    if (!selectedOrganizationId) return;

    const draft = featureDrafts[featureKey] ?? { enabled: false, limitValue: '' };
    const parsedLimit = draft.limitValue.trim() === '' ? null : Number(draft.limitValue);
    if (parsedLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 0)) {
      setMessage({ type: 'error', text: 'Feature limits must be a whole number greater than or equal to zero.' });
      return;
    }

    setPendingKey(featureKey);
    setMessage(null);

    const { data, error } = await supabase
      .from('feature_entitlements')
      .upsert(
        {
          organization_id: selectedOrganizationId,
          feature_key: featureKey,
          enabled: draft.enabled,
          limit_value: parsedLimit,
        },
        { onConflict: 'organization_id,feature_key' },
      )
      .select()
      .single();

    if (error || !data) {
      setMessage({ type: 'error', text: error?.message ?? 'Could not save the feature entitlement.' });
      setPendingKey(null);
      return;
    }

    setEntitlements((current) => [
      ...current.filter(
        (entitlement) =>
          !(
            entitlement.organization_id === selectedOrganizationId &&
            entitlement.feature_key === featureKey
          ),
      ),
      data,
    ]);
    setMessage({ type: 'success', text: `${featureKey} entitlement updated.` });
    setPendingKey(null);
    router.refresh();
  }

  if (organizations.length === 0 || plans.length === 0) {
    return (
      <EmptyState
        title={organizations.length === 0 ? 'No organizations yet' : 'No subscription plans yet'}
        description={
          organizations.length === 0
            ? 'Create an organization before assigning a subscription.'
            : 'Create or seed a subscription plan before assigning access.'
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}

      <Card>
        <CardHeader>
          <CardTitle>Organization subscription</CardTitle>
          <CardDescription>Assign a plan and synchronize the organization subscription status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSubscription} className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="subscription-organization">Organization</Label>
              <Select
                id="subscription-organization"
                value={selectedOrganizationId}
                onChange={(event) => setSelectedOrganizationId(event.target.value)}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name} ({organization.organization_type.toLowerCase()})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-plan">Plan</Label>
              <Select id="subscription-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-status">Status</Label>
              <Select
                id="subscription-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as SubscriptionStatus)}
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
            <Button type="submit" loading={pendingKey === 'subscription'}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>
          {selectedSubscription ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Started {new Date(selectedSubscription.started_at).toLocaleDateString('en-GB')} ·{' '}
              <Badge variant={selectedSubscription.status === 'ACTIVE' ? 'success' : 'muted'}>
                {selectedSubscription.status.toLowerCase()}
              </Badge>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature entitlements</CardTitle>
          <CardDescription>
            Control which product capabilities are enabled for {selectedOrganization?.name ?? 'this organization'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {FEATURE_CATALOG.map((feature) => {
            const draft = featureDrafts[feature.key] ?? { enabled: false, limitValue: '' };
            return (
              <FeatureRow
                key={feature.key}
                featureKey={feature.key}
                label={feature.label}
                description={feature.description}
                draft={draft}
                pending={pendingKey === feature.key}
                onChange={(next) => setFeatureDrafts((current) => ({ ...current, [feature.key]: next }))}
                onSave={() => saveFeature(feature.key)}
              />
            );
          })}

          {customFeatureKeys.map((featureKey) => (
            <FeatureRow
              key={featureKey}
              featureKey={featureKey}
              label={featureKey}
              description="Custom entitlement"
              draft={featureDrafts[featureKey] ?? { enabled: false, limitValue: '' }}
              pending={pendingKey === featureKey}
              onChange={(next) => setFeatureDrafts((current) => ({ ...current, [featureKey]: next }))}
              onSave={() => saveFeature(featureKey)}
            />
          ))}

          <AddFeatureRow
            onAdd={(featureKey) => {
              if (featureKey && !featureDrafts[featureKey]) {
                setFeatureDrafts((current) => ({ ...current, [featureKey]: { enabled: true, limitValue: '' } }));
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureRow({
  featureKey,
  label,
  description,
  draft,
  pending,
  onChange,
  onSave,
}: {
  featureKey: string;
  label: string;
  description: string;
  draft: FeatureDraft;
  pending: boolean;
  onChange: (draft: FeatureDraft) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Switch
          checked={draft.enabled}
          onCheckedChange={(enabled) => onChange({ ...draft, enabled })}
          label={`Enable ${label}`}
        />
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <Label htmlFor={`limit-${featureKey}`} className="whitespace-nowrap text-xs text-muted-foreground">
          Limit
        </Label>
        <Input
          id={`limit-${featureKey}`}
          type="number"
          min={0}
          placeholder="Unlimited"
          value={draft.limitValue}
          onChange={(event) => onChange({ ...draft, limitValue: event.target.value })}
          className="w-28"
        />
        <Button type="button" size="sm" variant="outline" loading={pending} onClick={onSave}>
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

function AddFeatureRow({ onAdd }: { onAdd: (featureKey: string) => void }) {
  const [featureKey, setFeatureKey] = useState('');

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="custom-feature">Add custom feature key</Label>
        <Input
          id="custom-feature"
          placeholder="e.g. medical.records"
          value={featureKey}
          onChange={(event) => setFeatureKey(event.target.value.toLowerCase().replace(/\s+/g, '.'))}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const normalized = featureKey.trim();
          if (!normalized) return;
          onAdd(normalized);
          setFeatureKey('');
        }}
      >
        <Plus className="h-4 w-4" />
        Add row
      </Button>
    </div>
  );
}
