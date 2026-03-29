'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import type { ApiResponse, User } from '@/lib/types/api'

export function useCurrentUser() {
  const { status } = useSession()

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User>>('/users/me')
      return res.data.data
    },
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5분
  })
}
