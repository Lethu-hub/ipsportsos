import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Sign in — IP Sports OS',
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in — send them straight to the portal.
  if (user) {
    redirect('/portal');
  }

  return <LoginForm />;
}
