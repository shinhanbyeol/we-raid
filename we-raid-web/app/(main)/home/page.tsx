export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">홈</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">다가오는 레이드</h2>
          <p className="text-slate-500">예정된 레이드 일정이 없습니다.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">내 그룹</h2>
          <p className="text-slate-500">소속된 그룹이 없습니다.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">공개 모집</h2>
          <p className="text-slate-500">공개 모집 중인 레이드가 없습니다.</p>
        </div>
      </div>
    </div>
  )
}
