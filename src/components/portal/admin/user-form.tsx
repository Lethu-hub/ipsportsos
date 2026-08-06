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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? '');
  const [role, setRole] = useState(roles[0]?.name ?? 'PLATFORM_OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function roleScope() {
    return roles.find((r) => r.name === role)?.scope ?? 'ORGANIZATION';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const isPlatform = roleScope() === 'PLATFORM';
    if (!isPlatform && !orgId) {
      setError('Please create or select an organization for this organization role.');
      setLoading(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc('create_staff_user', {
      p_organization_id: isPlatform ? null : orgId,
      p_role_name: role,
      p_email: email.trim().toLowerCase(),
      p_password: password,
      p_first_name: firstName.trim() || null,
      p_last_name: lastName.trim() || null,
      p_username: username.trim().toLowerCase() || null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    setSuccess(`User ${email} (${role.replaceAll('_', ' ')}) created successfully.`);
    setEmail('');
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
    setLoading(false);
    router.refresh();
  }

  const selectedRole = roles.find((r) => r.name === role);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? <FormMessage type="error">{error}</FormMessage> : null}
      {success ? <FormMessage type="success">{success}</FormMessage> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="coach@club.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-username">Username (optional)</Label>
          <Input
            id="user-username"
            type="text"
            placeholder="e.g. coach_molefe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-password">Initial password</Label>
          <div className="relative">
            <Input
              id="user-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Set a password"
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
          <Label htmlFor="user-first">First name</Label>
          <Input id="user-first" placeholder="Thabo" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-last">Last name</Label>
          <Input id="user-last" placeholder="Molefe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="user-org">Organization</Label>
          <Select
            id="user-org"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            disabled={selectedRole?.scope === 'PLATFORM'}
          >
            {selectedRole?.scope === 'PLATFORM' ? (
              <option value="">Global Platform (No organization required)</option>
            ) : organizations.length === 0 ? (
              <option value="">No organizations yet — create one first</option>
            ) : (
              organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))
            )}
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
