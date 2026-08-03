// ============================================================
// IP Sports OS — server-side auth & access helpers
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccessMembership, Profile } from '@/types/database';

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile | null;
  access: AccessMembership[];
};

/** Resolve the signed-in user with profile + role/permission access.
 * Returns null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileResult, accessResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle(),
    supabase.rpc('get_my_access'),
  ]);

  const raw = accessResult.data as unknown;
  const access = Array.isArray(raw) ? (raw as AccessMembership[]) : [];

  return {
    id: user.id,
    email: user.email ?? '',
    profile: profileResult.data ?? null,
    access,
  };
}

/** Require an authenticated user; otherwise bounce to /login. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/** True when the user holds any PLATFORM-scoped role. */
export function isPlatformAdmin(access: AccessMembership[]): boolean {
  return access.some((m) => m.role_scope === 'PLATFORM');
}

/** True when the user has `permissionKey` within the given organization. */
export function hasPermission(
  access: AccessMembership[],
  organizationId: string | null,
  permissionKey: string,
): boolean {
  if (access.some((m) => m.role_scope === 'PLATFORM')) return true;
  return access.some(
    (m) => m.organization_id === organizationId && m.permissions.includes(permissionKey),
  );
}

/** First organization-scoped membership (used by staff pages). */
export function primaryOrgMembership(access: AccessMembership[]) {
  return access.find((m) => m.organization_id !== null) ?? null;
}

/** Require a portal session with an organization membership. */
export async function requirePortalUser() {
  const session = await requireUser();
  return session;
}

/** Require a platform administrator. */
export async function requirePlatformAdmin() {
  const session = await requireUser();
  if (!isPlatformAdmin(session.access)) {
    redirect('/portal');
  }
  return session;
}
