import { DefaultSession } from 'next-auth'

interface BackendUser {
  id: string
  kakaoId: string
  nickname: string
  profileImage: string | null
  status: 'ACTIVE' | 'BANNED' | 'DELETED'
}

declare module 'next-auth' {
  interface Session {
    backendToken: string
    user: BackendUser & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string
    backendUser?: BackendUser
  }
}
