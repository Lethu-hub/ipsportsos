'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Deliberately do not reveal whether an account exists.
    setSent(true);
    setLoading(false);
  }

  return <AuthCard title="Reset your password" description="Enter your email and we’ll send a secure reset link.">
    {sent ? <FormMessage type="success">If an account exists for this email, a password-reset link is on its way. Check your inbox and spam folder.</FormMessage> : <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><Button className="w-full" loading={loading}>Send reset link</Button></form>}
    <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
  </AuthCard>;
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage(null);
    if (password.length < 12) { setMessage('Use at least 12 characters.'); return; }
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) { setMessage('This reset link is invalid or has expired. Request a new one.'); return; }
    router.replace('/login?reset=success'); router.refresh();
  }

  return <AuthCard title="Choose a new password" description="Use a unique password with at least 12 characters."><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12}/></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={12}/></div>{message && <FormMessage type="error">{message}</FormMessage>}<Button className="w-full" loading={loading}>Save new password</Button></form><Link href="/forgot-password" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Request another link</Link></AuthCard>;
}

function AuthCard({ title, description, children }: {title:string;description:string;children:React.ReactNode}) { return <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><div className="w-full max-w-md"><div className="mb-6 flex flex-col items-center text-center"><div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="h-6 w-6" /></div><h1 className="text-2xl font-bold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><div className="rounded-xl border border-border bg-card p-8 shadow-md">{children}</div></div></div>; }
