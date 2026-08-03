'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';

export function SportForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedCode = (code || name).toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);

    const { error: insertError } = await supabase.from('sports').insert({ name: name.trim(), code: normalizedCode });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setName('');
    setCode('');
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? <FormMessage type="error">{error}</FormMessage> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sport-name">Name</Label>
          <Input id="sport-name" placeholder="Football" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sport-code">Code (optional)</Label>
          <Input id="sport-code" placeholder="FOOTBALL" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      </div>
      <Button type="submit" loading={loading}>
        <Plus className="h-4 w-4" />
        Create sport
      </Button>
    </form>
  );
}
