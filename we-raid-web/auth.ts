import NextAuth from 'next-auth'
import Kakao from 'next-auth/providers/kakao'

export const {
 handlers, auth, signIn, signOut
} = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      if (trigger === 'update' && token.backendToken) {
        const res = await fetch(`${process.env.API_URL}/v1/users/me`, {
          headers: { Authorization: `Bearer ${token.backendToken}` },
        })
        if (res.ok) {
          const json = await res.json()
          token.backendUser = json.data
        }
        return token
      }
      if (account && profile) {
        const kakaoProfile = (profile as Record<string, unknown>)
        const kakaoAccount = kakaoProfile.kakao_account as Record<string, unknown> | undefined
        const kakaoProfileInfo = kakaoAccount?.profile as Record<string, unknown> | undefined

        const res = await fetch(`${process.env.API_URL}/v1/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kakaoId: String(kakaoProfile.id),
            nickname: kakaoProfileInfo?.nickname ?? token.name ?? 'user',
            profileImage: kakaoProfileInfo?.thumbnail_image_url ?? null,
          }),
        })
        if (!res.ok) {
          throw new Error(`Backend sync failed: ${res.status}`)
        }
        const json = await res.json()
        if (!json.data?.accessToken) {
          throw new Error('Backend sync response missing accessToken')
        }
        return {
          ...token,
          backendToken: json.data.accessToken,
          backendUser: json.data.user,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        backendToken: (token.backendToken as string) ?? '',
        user: token.backendUser
          ? { ...session.user, ...(token.backendUser as object) }
          : session.user,
      }
    },
  },
  pages: {
    signIn: '/login',
  },
})
