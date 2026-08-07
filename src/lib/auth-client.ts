import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/** Resolve username or email to a valid email address for Supabase Auth. */
export async function resolveIdentifierToEmail(
  supabase: SupabaseClient<Database>,
  identifier: string,
): Promise<string> {
  const trimmed = identifier.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('@')) return trimmed.toLowerCase();

  try {
    const { data } = await supabase.rpc('resolve_login_email', { p_identifier: trimmed });
    if (data && typeof data === 'string' && data.length > 0) {
      return data.toLowerCase();
    }
  } catch {
    // Fallback if RPC is unavailable
  }

  // Built-in fallbacks for common admin usernames
  if (trimmed.toLowerCase() === 'admin') {
    return 'admin@ipsportsos.app';
  }

  if (trimmed.toLowerCase() === 'mpofu9898') {
    return 'mpofu9898@gmail.com';
  }

  return trimmed;
}
