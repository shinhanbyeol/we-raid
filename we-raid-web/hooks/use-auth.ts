'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { data: session, status } = useSession()
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    if (session?.user && session.user.id) {
      setUser({
        id: session.user.id,
        kakaoId: session.user.kakaoId,
        nickname: session.user.nickname ?? session.user.name ?? '',
        profileImage: session.user.profileImage ?? session.user.image ?? null,
        status: session.user.status ?? 'ACTIVE',
        isAdmin: session.user.isAdmin ?? false,
        createdAt: session.user.createdAt ?? '',
        updatedAt: '',
      })
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser])

  return {
    user,
    session,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    signOut: () => signOut({ callbackUrl: '/login' }),
  }
}
