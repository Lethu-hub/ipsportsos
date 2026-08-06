import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SETUP_PATH = '/setup';

function setupResponse(request: NextRequest) {
  return NextResponse.rewrite(new URL(SETUP_PATH, request.url));
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Server Components also create a Supabase client, so allowing the request
  // through here would only turn a missing environment variable into a vague
  // 500 error later in the render. Show an actionable setup page instead.
  if (!supabaseUrl || !supabaseAnonKey) {
    return request.nextUrl.pathname === SETUP_PATH ? NextResponse.next() : setupResponse(request);
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    try {
      await supabase.auth.getUser();
    } catch {
      // Supabase being temporarily unreachable should not take down the site.
    }

    return supabaseResponse;
  } catch {
    // Invalid Supabase configuration should be just as actionable as missing
    // configuration, rather than becoming MIDDLEWARE_INVOCATION_FAILED.
    return setupResponse(request);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
