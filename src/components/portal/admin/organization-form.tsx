'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FormMessage } from '@/components/ui/form-message';

interface OrganizationFormProps {
  sports: { id: string; name: string }[];
}

export function OrganizationForm({ sports }: OrganizationFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'CLUB' | 'LEAGUE' | 'ACADEMY' | 'ASSOCIATION'>('CLUB');
  const [sportId, setSportId] = useState(sports[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sportId) {
      setError('Create a sport first.');
      return;
    }
    setError(null);
    setLoading(true);

    const autoSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data, error: insertError } = await supabase
      .from('organizations')
      .insert({ name: name.trim(), slug: autoSlug, organization_type: type, sport_id: sportId, status: 'ACTIVE', subscription_status: 'PENDING' })
      .select('id')
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Give the new organization default public sections + branding row.
    const orgId = data.id;
    await supabase.from('organization_branding').insert({ organization_id: orgId });
    await supabase.from('club_page_sections').insert([
      { organization_id: orgId, section_type: 'history', enabled: true, display_order: 1 },
      { organization_id: orgId, section_type: 'squad', enabled: true, display_order: 2 },
      { organization_id: orgId, section_type: 'news', enabled: true, display_order: 3 },
      { organization_id: orgId, section_type: 'sponsors', enabled: true, display_order: 4 },
      { organization_id: orgId, section_type: 'stadium', enabled: true, display_order: 5 },
    ]);

    setName('');
    setSlug('');
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? <FormMessage type="error">{error}</FormMessage> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Name</Label>
          <Input id="org-name" placeholder="Example Sports Club" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-slug">URL slug (optional)</Label>
          <Input id="org-slug" placeholder="matebele-fc" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-type">Type</Label>
          <Select id="org-type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="CLUB">Club</option>
            <option value="LEAGUE">League</option>
            <option value="ACADEMY">Academy</option>
            <option value="ASSOCIATION">Association</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-sport">Sport</Label>
          <Select id="org-sport" value={sportId} onChange={(e) => setSportId(e.target.value)}>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Button type="submit" loading={loading}>
        <Plus className="h-4 w-4" />
        Create organization
      </Button>
    </form>
  );
}
