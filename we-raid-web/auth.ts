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
    async jwt({ token, account, profile }) {
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
        const json = await res.json()
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
