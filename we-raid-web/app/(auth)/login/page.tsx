import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'We-Raid — 게임 레이드 일정 조율 서비스',
  description: '레이드 일정을 쉽게 잡고 팀을 꾸려보세요.',
  openGraph: {
    title: 'We-Raid',
    description: '레이드 일정을 쉽게 잡고 팀을 꾸려보세요.',
    type: 'website',
  },
}

const LoginPage = () => <LoginForm />

export default LoginPage
