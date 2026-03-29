import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">{children}</main>
    </div>
  )
}
