export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">관리자 대시보드</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">유저 관리</h2>
          <p className="text-4xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">게임 관리</h2>
          <p className="text-4xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">일정 관리</h2>
          <p className="text-4xl font-bold text-slate-900">-</p>
        </div>
      </div>
    </div>
  )
}
