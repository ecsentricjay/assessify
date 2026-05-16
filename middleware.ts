import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Route Definitions ────────────────────────────────────────────────────────

// Fully public — no auth needed
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/verify',
  '/auth/reset-password',
  '/auth/update-password',
  '/partner/register',
  '/partner/login',
  '/assignments',   // public assignment access by code
  '/tests',         // public test access by code
]

// Auth required but no specific role check (role redirect handled in the page)
const AUTH_ONLY_ROUTES: string[] = []

// Role-protected routes — key is route prefix, value is allowed role(s)
const ROLE_ROUTES: Record<string, string[]> = {
  '/student':             ['student'],
  '/lecturer':            ['lecturer'],
  '/partner':             ['partner'],
  '/institution':         ['institution_admin'],
  '/admin':               ['admin', 'super_admin'],
}

// Where to send each role after login
const ROLE_HOME: Record<string, string> = {
  student:            '/student/dashboard',
  lecturer:           '/lecturer/dashboard',
  partner:            '/partner',
  institution_admin:  '/institution/dashboard',
  admin:              '/admin',
  super_admin:        '/admin',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles
    }
  }
  return null
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = path
  url.search = ''
  return NextResponse.redirect(url)
}

function redirectToLoginWithReturn(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  const returnTo = encodeURIComponent(request.nextUrl.pathname)
  url.pathname = '/auth/login'
  url.search = `?returnTo=${returnTo}`
  return NextResponse.redirect(url)
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Always allow public routes through immediately
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. Set up Supabase client with cookie handling
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // 4. If not authenticated and route requires auth → redirect to login
  const requiredRoles = getRequiredRoles(pathname)
  if (!user || userError) {
    if (requiredRoles !== null || AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      return redirectToLoginWithReturn(request)
    }
    // No auth needed for this route
    return supabaseResponse
  }

  // 5. User is authenticated — fetch their role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as string | undefined

  // 6. If trying to access auth pages while logged in → redirect to their dashboard
  if (pathname.startsWith('/auth/')) {
    const home = role ? (ROLE_HOME[role] || '/') : '/'
    return redirectTo(request, home)
  }

  // 7. Check role authorization for protected routes
  if (requiredRoles !== null) {
    if (!role || !requiredRoles.includes(role)) {
      // Wrong role — send them to their own dashboard
      const home = role ? (ROLE_HOME[role] || '/') : '/auth/login'
      console.warn(
        `[middleware] Access denied: role="${role}" tried to access "${pathname}" (requires: ${requiredRoles.join('|')})`
      )
      return redirectTo(request, home)
    }
  }

  // 8. All checks passed
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (svg, png, jpg, jpeg, gif, webp)
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}