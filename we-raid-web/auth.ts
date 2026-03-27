import NextAuth from 'next-auth'
import Kakao from 'next-auth/providers/kakao'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const res = await fetch(`${process.env.API_URL}/v1/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kakaoId: String((profile as Record<string, unknown>).id),
            nickname: ((profile as Record<string, unknown>).kakao_account as Record<string, unknown> | undefined)
              ?.profile
              ? (((profile as Record<string, unknown>).kakao_account as Record<string, unknown>).profile as Record<string, unknown>).nickname ?? token.name ?? 'user'
              : token.name ?? 'user',
            profileImage: ((profile as Record<string, unknown>).kakao_account as Record<string, unknown> | undefined)
              ?.profile
              ? (((profile as Record<string, unknown>).kakao_account as Record<string, unknown>).profile as Record<string, unknown>).thumbnail_image_url ?? null
              : null,
          }),
        })
        const json = await res.json()
        token.backendToken = json.data.accessToken
        token.backendUser = json.data.user
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
