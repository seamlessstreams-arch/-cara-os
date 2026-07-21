import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPublicPath, isApiPath } from '@/lib/auth/public-paths'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Publishable-or-anon, same fallback as client.ts — with only the legacy
    // anon key set, the bare assertion passed `undefined` and session refresh
    // died on every request.
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    // An API caller must get a 401 it can read, never a 302 to an HTML login
    // page: a redirect makes every fetch() in the app look like a mysterious
    // parse error, and makes an unauthenticated probe look "fine". Same
    // wording as the per-route guards so the two are indistinguishable.
    if (isApiPath(request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'A valid authenticated session is required.' },
        { status: 401 },
      )
    }
    // No session on a platform page: send to the login door, remembering where
    // the visitor was heading so sign-in returns them there. The marketing
    // site (isPublicPath) stays public even in activated mode.
    const url = request.nextUrl.clone()
    const next = request.nextUrl.pathname + request.nextUrl.search
    url.pathname = '/auth/login'
    url.search = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
