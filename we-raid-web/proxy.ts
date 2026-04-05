import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const { pathname } = req.nextUrl
  const user = req.auth?.user as { isAdmin?: boolean; boarded?: boolean } | undefined

  const publicPaths = ['/login']
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(user?.boarded ? '/home' : '/onboarding', req.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/onboarding')) {
    if (user?.boarded) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
    return NextResponse.next()
  }

  if (!user?.boarded) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!user?.isAdmin) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
