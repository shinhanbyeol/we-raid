import { create } from 'zustand'

interface User {
  id: string
  kakaoId: string
  nickname: string
  profileImage: string | null
  status: 'ACTIVE' | 'BANNED' | 'DELETED'
}

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
