'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FormMessage } from '@/components/ui/form-message';

interface UserFormProps {
  organizations: { id: string; name: string }[];
  roles: { name: string; scope: 'PLATFORM' | 'ORGANIZATION' }[];
}

export function UserForm({ organizations, roles }: UserFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? '');
  const [role, setRole] = useState(roles.find((r) => r.scope === 'ORGANIZATION')?.name ?? roles[0]?.name ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: rpcError } = await supabase.rpc('create_staff_user', {
      p_organization_id: roleScope() === 'PLATFORM' ? null : orgId,
      p_role_name: role,
      p_email: email,
      p_password: password,
      p_first_name: firstName || null,
      p_last_name: lastName || null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
    setLoading(false);
    router.refresh();
  }

  function roleScope() {
    return roles.find((r) => r.name === role)?.scope ?? 'ORGANIZATION';
  }

  const selectedRole = roles.find((r) => r.name === role);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? <FormMessage type="error">{error}</FormMessage> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="user-email">Email</Label>
          <Input id="user-email" type="email" placeholder="coach@club.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-password">Initial password</Label>
          <div className="relative">
            <Input
              id="user-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Set a temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <KeyRound className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-first">First name</Label>
          <Input id="user-first" placeholder="Thabo" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-last">Last name</Label>
          <Input id="user-last" placeholder="Molefe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-role">Role</Label>
          <Select id="user-role" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name.replaceAll('_', ' ')} ({r.scope.toLowerCase()})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-org">Organization</Label>
          <Select id="user-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} disabled={selectedRole?.scope === 'PLATFORM'}>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Button type="submit" loading={loading}>
        <Plus className="h-4 w-4" />
        Create user
      </Button>
    </form>
  );
}
