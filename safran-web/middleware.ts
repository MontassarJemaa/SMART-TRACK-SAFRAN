import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = [
    '/dashboard',
    '/alertes',
    '/outillages',
    '/transferts',
    '/inventaire',
    '/rapports',
    '/reglages',
  ];
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`)
  );
  const isLoginRoute = request.nextUrl.pathname === '/login';

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/alertes/:path*',
    '/outillages/:path*',
    '/transferts/:path*',
    '/inventaire/:path*',
    '/rapports/:path*',
    '/reglages/:path*',
    '/login',
  ],
};
