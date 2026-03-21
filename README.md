# We-Raid

온라인 게임 레이드 일정 조율 서비스. 플레이 가능 시간(PT) 기반 자동 시간대 추천, 일정 충돌 감지, 캐릭터 스펙 관리를 지원합니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router) + TypeScript |
| 상태 관리 | Zustand + TanStack Query v5 |
| UI | Tailwind CSS v4 + shadcn/ui |
| 백엔드 | NestJS 11 + TypeScript |
| ORM | Prisma 7 |
| DB | PostgreSQL 16 |
| 캐시/세션 | Redis 7 |
| 인증 | 카카오 OAuth 2.0 + JWT (Access/Refresh) |

---

## 프로젝트 구조

```
we-raid/
├── we-raid-web/          # Next.js 프론트엔드
├── we-raid-api/          # NestJS 백엔드
├── docs/
│   └── 기획/
│       └── we-raid-spec.md
├── docker-compose.yml    # PostgreSQL + Redis 로컬 환경
└── package.json          # npm workspaces 루트
```

### 프론트엔드 (`we-raid-web/`)

```
we-raid-web/
├── app/
│   ├── (auth)/           # 로그인, 온보딩 (비인증 레이아웃)
│   │   ├── login/
│   │   └── onboarding/
│   ├── (main)/           # 홈, 일정, 그룹, 마이페이지 (인증 레이아웃)
│   │   └── home/
│   ├── admin/            # 관리자 페이지
│   ├── layout.tsx        # 루트 레이아웃 (Providers 포함)
│   ├── page.tsx          # 루트 → /login 리다이렉트
│   └── providers.tsx     # QueryClientProvider
├── components/
│   ├── ui/               # shadcn/ui 기반 공통 컴포넌트
│   ├── schedule/         # 일정 관련 컴포넌트
│   ├── character/        # 캐릭터 관련 컴포넌트
│   └── pt/               # PT 히트맵, 주간 그리드
├── lib/
│   ├── api.ts            # axios 인스턴스 (401 자동 토큰 갱신)
│   └── hooks/            # 커스텀 훅
└── store/
    └── auth.store.ts     # Zustand 인증 스토어
```

### 백엔드 (`we-raid-api/`)

```
we-raid-api/
├── src/
│   ├── auth/             # JWT, 카카오 OAuth 전략
│   ├── users/            # User 모듈
│   ├── characters/       # Character 모듈
│   ├── games/            # Game, EventType, GameServer 모듈
│   ├── groups/           # Group, GroupMember 모듈
│   ├── schedules/        # Schedule, Participant, ScheduleSlot 모듈
│   ├── playable-times/   # PlayableTime 모듈
│   ├── notifications/    # 알림 (인앱 + 카카오 알림톡 + Web Push)
│   ├── admin/            # 관리자 전용 API
│   └── common/
│       ├── prisma/       # PrismaService (Global)
│       ├── guards/       # JwtAuthGuard, RolesGuard
│       └── decorators/   # @CurrentUser()
├── prisma/
│   └── schema.prisma     # DB 스키마 (13개 엔티티)
├── prisma.config.ts      # Prisma 연결 설정 (Prisma 7)
└── test/
```

---

## 데이터 모델

| 엔티티 | 설명 |
|--------|------|
| `User` | 카카오 계정 기반 사용자 |
| `Game` | 지원 게임 (로스트아크, WoW, 아이온2 등) |
| `GameServer` | 게임별 서버 목록 (관리자 등록) |
| `Character` | 사용자의 게임 캐릭터 (서버, 역할, 스펙 포함) |
| `PlayableTime` | 플레이 가능 시간 (요일 + 시간대) |
| `Group` | 길드/파티 그룹 |
| `GroupMember` | 그룹-사용자 관계 (OWNER / SUB_LEADER / MEMBER) |
| `EventType` | 게임별 이벤트 유형 |
| `Schedule` | 레이드 일정 |
| `ScheduleSlot` | 포지션별 모집 정원 |
| `Participant` | 초대/참가 이력 (PENDING / ACCEPTED / DECLINED / WAITLIST) |
| `Notification` | 인앱 알림 히스토리 |
| `Friendship` | 사용자 간 친구 관계 |

---

## 로컬 개발 환경 시작

### 사전 요구사항

- Node.js 20+
- Docker Desktop
- npm 10+

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd we-raid
npm install
```

### 2. 환경 변수 설정

**백엔드** — `we-raid-api/.env` 수정:

```env
DATABASE_URL="postgresql://weraid:weraid_local@localhost:5432/weraid_dev"
REDIS_URL="redis://localhost:6379"

# 256비트 이상 랜덤 키로 교체
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# 카카오 개발자 콘솔에서 발급
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:3001/v1/auth/kakao/callback

FRONTEND_URL=http://localhost:3000
PORT=3001
```

**프론트엔드** — `we-raid-web/.env.local` 수정:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_KAKAO_APP_KEY=
```

### 3. DB & Redis 시작

```bash
docker-compose up -d
```

### 4. DB 마이그레이션

```bash
cd we-raid-api
npx prisma migrate dev --name init
```

### 5. 개발 서버 실행

터미널을 두 개 열고 각각 실행합니다.

```bash
# 터미널 1 — 백엔드 (http://localhost:3001)
cd we-raid-api
npm run start:dev

# 터미널 2 — 프론트엔드 (http://localhost:3000)
cd we-raid-web
npm run dev
```

### 6. shadcn/ui 초기화 (최초 1회)

```bash
cd we-raid-web
npx shadcn@latest init
npx shadcn@latest add button input label card badge avatar dialog sheet tabs
```

---

## 주요 스크립트

### 백엔드

| 명령 | 설명 |
|------|------|
| `npm run start:dev` | 개발 서버 (watch 모드) |
| `npm run build` | 프로덕션 빌드 |
| `npm run test` | 유닛 테스트 |
| `npm run test:e2e` | E2E 테스트 |
| `npm run prisma:generate` | Prisma Client 재생성 |
| `npm run prisma:migrate` | DB 마이그레이션 실행 |
| `npm run prisma:studio` | Prisma Studio (DB GUI) |

### 프론트엔드

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |

---

## API 문서

백엔드 서버 실행 후 Swagger UI에서 확인할 수 있습니다.

```
http://localhost:3001/v1/docs
```

---

## 주요 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/v1/auth/kakao` | 카카오 OAuth 리다이렉트 URL |
| `GET` | `/v1/auth/kakao/callback` | 카카오 콜백 처리, JWT 발급 |
| `POST` | `/v1/auth/refresh` | Access Token 재발급 |
| `POST` | `/v1/auth/logout` | 로그아웃 (Redis 토큰 삭제) |
| `GET` | `/v1/characters` | 내 캐릭터 목록 |
| `POST` | `/v1/schedules` | 레이드 일정 생성 |
| `POST` | `/v1/schedules/:id/participants` | 참여자 초대 |
| `PATCH` | `/v1/schedules/:id/participants/me` | 참여 수락/거절 |
| `GET` | `/v1/playable-times` | 내 PT 목록 |
| `GET` | `/v1/games/:gameId/servers` | 게임별 서버 목록 |

---

## 코드 컨벤션

- **TypeScript strict 모드** — `any` 사용 금지
- **API 응답 형식**
  - 성공: `{ data: T, message: string }`
  - 실패: `{ error: string, code: string }` (예: `WR-AUTH-001`)
- **날짜/시간** — DB 저장: UTC / API 송수신: ISO 8601 / 화면 표시: 로컬 타임존 (`date-fns-tz`)
- **브랜치 전략** — `main` ← `develop` ← `feature/{description}`
- **커밋 메시지** — Conventional Commits (예: `feat(character): add server selection field`)

---

## 알려진 이슈 및 참고사항

- **Prisma 7** — `schema.prisma`에 `url = env(...)` 대신 `prisma.config.ts`에서 `DATABASE_URL` 관리 (Prisma 7 breaking change)
- **카카오 알림톡** — 카카오 비즈니스 계정 및 알림톡 채널 사전 등록 필요 (심사 2~4주 소요)
- **`@nestjs-modules/ioredis`** — NestJS 11 peer dependency 미지원. Redis는 `ioredis`를 직접 주입하여 사용
