'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';
import type { Organization } from '@/types/database';

interface ClubLoginFormProps {
  club: Organization & {
    organization_branding?: {
      primary_color: string | null;
      secondary_color: string | null;
      accent_color: string | null;
    } | null;
  };
}

export function ClubLoginForm({ club }: ClubLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Invalid email or password for this club portal.');
      setLoading(false);
      return;
    }

    router.refresh();
  }

  const primaryColor = club.organization_branding?.primary_color ?? '#2563eb';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {club.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Staff Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-md">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club-email">Staff Email</Label>
              <Input
                id="club-email"
                type="email"
                autoComplete="email"
                placeholder="you@club.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-password">Password</Label>
              <Input
                id="club-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? <FormMessage type="error">{error}</FormMessage> : null}
            <div className="text-right"><Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>Forgot password?</Link></div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: primaryColor }}
              size="lg"
              loading={loading}
            >
              Sign in to Portal
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
