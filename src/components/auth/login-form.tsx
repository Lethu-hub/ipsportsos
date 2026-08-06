'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveIdentifierToEmail } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') ?? '/portal';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const resolvedEmail = await resolveIdentifierToEmail(supabase, identifier);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (signInError) {
      setError('Invalid username/email or password. Please try again.');
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Portal Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your username or email.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-md">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-identifier">Username or Email</Label>
              <Input
                id="login-identifier"
                type="text"
                autoComplete="username"
                placeholder="mpofu9898 or coach@club.com"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? <FormMessage type="error">{error}</FormMessage> : null}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to IP Sports OS?{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            Explore the public site
          </Link>
        </p>
      </div>
    </div>
  );
}
