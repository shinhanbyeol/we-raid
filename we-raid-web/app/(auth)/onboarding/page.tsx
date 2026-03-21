export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-4 text-xl font-bold text-slate-900">프로필 설정</h1>
        <p className="mb-6 text-slate-500">We-Raid에서 사용할 닉네임을 설정해주세요.</p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="닉네임"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">
            시작하기
          </button>
        </div>
      </div>
    </div>
  )
}
