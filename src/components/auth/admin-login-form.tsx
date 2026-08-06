'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveIdentifierToEmail } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';

export function AdminLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const resolvedEmail = await resolveIdentifierToEmail(supabase, identifier);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (signInError) {
        const msg =
          typeof signInError === 'string'
            ? signInError
            : signInError.message && signInError.message !== '{}'
              ? signInError.message
              : 'Invalid admin credentials. Please check your username/email and password.';
        setError(msg);
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Unable to connect to authentication service. Please try again.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your admin username or email.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-md">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-identifier">Username or Email</Label>
              <Input
                id="admin-identifier"
                type="text"
                autoComplete="username"
                placeholder="mpofu9898 or mpofu9898@gmail.com"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? <FormMessage type="error">{error}</FormMessage> : null}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Access Admin Console
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
