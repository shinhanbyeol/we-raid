import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const MainLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const session = await auth()
  if (!session) redirect('/login')

  // 캐릭터가 없으면 온보딩으로 이동
  try {
    const res = await fetch(`${process.env.API_URL}/v1/characters`, {
      headers: { Authorization: `Bearer ${session.backendToken}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json()
      if (Array.isArray(json.data) && json.data.length === 0) {
        redirect('/onboarding')
      }
    }
  } catch {
    // API 요청 실패 시 온보딩 체크 생략
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default MainLayout
