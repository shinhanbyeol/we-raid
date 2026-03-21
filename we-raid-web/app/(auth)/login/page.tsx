export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">We-Raid</h1>
        <p className="mb-6 text-center text-slate-500">레이드 일정 관리 서비스</p>
        <button className="flex w-full items-center justify-center gap-3 rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-slate-900 hover:bg-yellow-500">
          카카오로 로그인
        </button>
      </div>
    </div>
  )
}
