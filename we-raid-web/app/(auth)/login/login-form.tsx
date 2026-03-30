'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const LoginFormInner = () => {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await signIn('kakao', { callbackUrl })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">We-Raid</h1>
          <p className="mt-2 text-sm text-slate-500">게임 레이드 일정 조율 서비스</p>
        </div>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-yellow-500 disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="size-5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.766 1.677 5.19 4.2 6.6l-1.07 3.97a.3.3 0 0 0 .46.32l4.84-3.22A11.6 11.6 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
          </svg>
          {loading ? '로그인 중...' : '카카오로 로그인'}
        </button>
      </div>
    </div>
  )
}

export const LoginForm = () => (
  <Suspense>
    <LoginFormInner />
  </Suspense>
  )
