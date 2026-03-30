'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
 ApiResponse, CharacterRole, Game, GameServer
} from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Step = 1 | 2 | 3 | 4

const ROLES: { value: CharacterRole; label: string }[] = [
  { value: 'TANK', label: '탱커' },
  { value: 'HEAL', label: '힐러' },
  { value: 'DPS', label: '딜러' },
  { value: 'SUPPORT', label: '서포터' },
  { value: 'ETC', label: '기타' },
]

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

const OnboardingPage = () => {
  const router = useRouter()
  const { data: session } = useSession()

  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1
  const [nickname, setNickname] = useState('')

  // Step 2
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // Step 3
  const [serverId, setServerId] = useState('')
  const [serverName, setServerName] = useState('')
  const [charNickname, setCharNickname] = useState('')
  const [role, setRole] = useState<CharacterRole>('DPS')

  // Step 4
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('23:00')

  useEffect(() => {
    if (session?.user?.nickname) {
      setNickname(session.user.nickname)
    }
  }, [session?.user?.nickname])

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Game[]>>('/games')
      return res.data.data.filter((g) => g.isActive)
    },
    enabled: step === 2,
  })

  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['servers', selectedGame?.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GameServer[]>>(`/games/${selectedGame!.id}/servers`)
      return res.data.data.filter((s) => s.isActive)
    },
    enabled: step === 3 && !!selectedGame,
  })

  // When servers load, reset server selection
  useEffect(() => {
    setServerId('')
    setServerName('')
  }, [selectedGame?.id])

  const handleStep1 = async () => {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (nickname !== session?.user?.nickname) {
        await api.patch('/users/me', { nickname })
      }
      setStep(2)
    } catch {
      setError('닉네임 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = () => {
    if (!selectedGame) {
      setError('게임을 선택해주세요.')
      return
    }
    setError('')
    setStep(3)
  }

  const handleStep3 = async () => {
    const finalServerName = serverId
      ? (servers?.find((s) => s.id === serverId)?.name ?? serverName)
      : serverName
    if (!finalServerName.trim()) {
      setError('서버 이름을 입력해주세요.')
      return
    }
    if (!charNickname.trim()) {
      setError('캐릭터 닉네임을 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/characters', {
        gameId: selectedGame!.id,
        serverId: serverId || undefined,
        serverName: finalServerName,
        nickname: charNickname,
        role,
        isMain: true,
      })
      setStep(4)
    } catch {
      setError('캐릭터 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async (skip = false) => {
    if (!skip && selectedDays.length > 0) {
      setLoading(true)
      try {
        await api.post('/playable-times', {
          items: selectedDays.map((day) => ({
            dayOfWeek: day,
            startTime,
            endTime,
            isRecurring: true,
          })),
        })
      } catch {
        // PT 등록 실패해도 진행
      } finally {
        setLoading(false)
      }
    }
    router.push('/home')
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day)
      return [...prev, day]
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-md">
        {/* 진행 바 */}
        <div className="mb-6 flex gap-1.5">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: 닉네임 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">닉네임 설정</h2>
              <p className="mt-1 text-sm text-slate-500">We-Raid에서 사용할 닉네임을 설정해주세요.</p>
            </div>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 (2~20자)"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" onClick={handleStep1} disabled={loading}>
              다음
            </Button>
          </div>
        )}

        {/* Step 2: 게임 선택 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">게임 선택</h2>
              <p className="mt-1 text-sm text-slate-500">주로 플레이하는 게임을 선택해주세요.</p>
            </div>
            {gamesLoading ? (
              <p className="text-sm text-slate-500">게임 목록 불러오는 중...</p>
            ) : (
              <div className="grid gap-2">
                {games?.map((game) => (
                  <button
                    type="button"
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selectedGame?.id === game.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {game.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.thumbnailUrl} alt="" className="size-8 rounded object-cover" />
                    )}
                    {game.name}
                  </button>
                ))}
                {games?.length === 0 && (
                  <p className="text-sm text-slate-500">등록된 게임이 없습니다.</p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" onClick={handleStep2} disabled={!selectedGame || gamesLoading}>
              다음
            </Button>
          </div>
        )}

        {/* Step 3: 캐릭터 등록 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">캐릭터 등록</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedGame?.name}
                {' '}
                본캐 정보를 입력해주세요.
              </p>
            </div>

            {/* 서버 선택 */}
            {(() => {
              if (serversLoading) {
                return <p className="text-sm text-slate-500">서버 목록 불러오는 중...</p>
              }
              if (servers && servers.length > 0) {
                return (
                  <div className="space-y-1.5">
                    <label htmlFor="server-select" className="text-sm font-medium text-slate-700">서버</label>
                    <select
                      id="server-select"
                      value={serverId}
                      onChange={(e) => {
                        const sv = servers.find((s) => s.id === e.target.value)
                        setServerId(e.target.value)
                        setServerName(sv?.name ?? '')
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">서버를 선택해주세요</option>
                      {servers.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              }
              return (
                <div className="space-y-1.5">
                  <label htmlFor="server-name-input" className="text-sm font-medium text-slate-700">서버 이름</label>
                  <Input
                    id="server-name-input"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="서버 이름 입력"
                    maxLength={50}
                  />
                </div>
              )
            })()}

            {/* 캐릭터 닉네임 */}
            <div className="space-y-1.5">
              <label htmlFor="char-nickname-input" className="text-sm font-medium text-slate-700">캐릭터 닉네임</label>
              <Input
                id="char-nickname-input"
                value={charNickname}
                onChange={(e) => setCharNickname(e.target.value)}
                placeholder="인게임 닉네임"
                maxLength={30}
              />
            </div>

            {/* 역할 선택 */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">역할</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(({ value, label }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setRole(value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      role === value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" onClick={handleStep3} disabled={loading}>
              다음
            </Button>
          </div>
        )}

        {/* Step 4: 플레이 가능 시간 */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">플레이 가능 시간</h2>
              <p className="mt-1 text-sm text-slate-500">
                주로 레이드에 참여 가능한 요일과 시간대를 설정해주세요.
              </p>
            </div>

            {/* 요일 선택 */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700">요일</p>
              <div className="flex gap-1.5">
                {DAYS.map((label, i) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => toggleDay(i)}
                    className={`size-9 rounded-lg text-sm font-medium transition-colors ${
                      selectedDays.includes(i)
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 시간 범위 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="start-time-input" className="text-sm font-medium text-slate-700">시작 시간</label>
                <Input
                  id="start-time-input"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="end-time-input" className="text-sm font-medium text-slate-700">종료 시간</label>
                <Input
                  id="end-time-input"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleFinish(true)}
                disabled={loading}
              >
                건너뛰기
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleFinish(false)}
                disabled={loading || selectedDays.length === 0}
              >
                완료
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OnboardingPage
