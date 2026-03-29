# We-Raid Agent Note

> 이 문서는 AI 에이전트가 프로젝트 컨텍스트를 빠르게 파악하기 위한 요약 노트입니다.

---

## 프로젝트 개요

**We-Raid** — 게임 레이드 일정 조율 서비스 (한국어 UI).
모노레포 구조, NestJS API + Next.js 웹 프론트엔드.

```
we-raid/
├── we-raid-api/      # NestJS 11 백엔드 (포트 3001)
├── we-raid-web/      # Next.js 16 App Router 프론트엔드 (포트 3000)
├── docs/개발/        # 기획·개발 문서
└── package.json      # npm workspaces 루트
```

---

## 기술 스택

### 백엔드 (`we-raid-api`)
| 항목 | 내용 |
|------|------|
| Framework | NestJS 11 |
| DB | SQLite (Prisma, 프로토타입) → 추후 PostgreSQL 16 전환 예정 |
| Auth | passport-jwt (JwtAuthGuard), Admin은 AdminGuard 별도 |
| 캐시 | 인메모리 CacheService (Redis 대체, 프로토타입) |
| 파일 업로드 | multer 로컬 저장 → 추후 S3 교체 예정 |
| 실시간 알림 | SSE (Server-Sent Events), userId별 Subject 맵 |
| 크론 | @nestjs/schedule Cron(*/15 * * * *) |
| 반복 일정 | rrule v2.8.1 |
| Rate Limiting | 전체 100req/min, 로그인 10req/min |
| API prefix | `/v1` |

### 프론트엔드 (`we-raid-web`)
| 항목 | 내용 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth(Auth.js v5), Kakao OAuth provider |
| 상태 관리 | Zustand (인증 스토어) + React Query (서버 상태) |
| UI | shadcn/ui (base-nova 테마, Tailwind v4) |
| HTTP 클라이언트 | axios (`lib/api.ts`), Bearer 토큰 자동 주입 |

---

## 백엔드 핵심 패턴

### 응답 형식

**성공:**
```json
{ "data": { ... }, "message": "ok" }
```

**에러:**
```json
{ "code": "WR-{MODULE}-{NUMBER}", "message": "에러 설명", "path": "/v1/..." }
```

### 에러 코드 도메인
| 도메인 | 코드 접두사 |
|--------|------------|
| 공통 | `WR-COMMON-` |
| 그룹 | `WR-GROUP-001~015` |
| 일정 | `WR-SCHED-001~016` |
| 친구 | `WR-FRIEND-001~008` |
| HTTP 기본 | `WR-COMMON-{HTTP STATUS}` |

### 인증
- 모든 보호 엔드포인트: `Authorization: Bearer {jwtToken}`
- JWT payload: `{ sub: userId, ... }`
- `@CurrentUser()` 데코레이터로 컨트롤러에서 유저 주입
- Admin 전용: `JwtAuthGuard + AdminGuard` (User.isAdmin = true)

### NextAuth ↔ 백엔드 연동 흐름
```
1. 카카오 로그인 → NextAuth jwt callback
2. NextAuth가 POST /v1/auth/sync 호출 (kakaoId, nickname, profileImage)
3. 백엔드: upsert User → JWT 발급 → { accessToken } 반환
4. NextAuth session에 backendToken 저장
5. axios interceptor: session.backendToken → Authorization 헤더
```

---

## 프론트엔드 현황 (2026-03-29)

### 구현 완료
- `lib/api.ts` — axios 인스턴스, 401 인터셉터 (토큰 갱신 준비)
- `store/auth.store.ts` — Zustand `{ user, setUser }`
- `auth.ts` — NextAuth Kakao, jwt callback → /v1/auth/sync
- `proxy.ts` — 미들웨어 라우트 보호 (public: /login)
- `app/providers.tsx` — SessionProvider + QueryClientProvider
- `components/ui/button.tsx` — shadcn button 컴포넌트 (유일하게 설치됨)

### 미구현 (모두 placeholder)
- 모든 페이지 (`app/**/*.tsx`)
- shadcn 컴포넌트 (input, card, badge, avatar, dialog, sheet, tabs 등)
- API 응답 타입 (`lib/types/`)
- 커스텀 훅 (`hooks/`)
- 레이아웃 (auth guard, sidebar)

### 프론트엔드 작업 순서 (권장)
1. shadcn 컴포넌트 설치
2. `lib/types/api.ts` 타입 정의
3. `hooks/` 커스텀 훅
4. `app/(main)/layout.tsx` auth guard + 사이드바
5. `app/(auth)/login/page.tsx` 로그인 페이지
6. `app/(auth)/onboarding/page.tsx` 온보딩 (4단계)
7. 홈 대시보드
8. 캐릭터, PT, 그룹, 일정 관리 페이지

---

## 주요 파일 경로

### 백엔드
| 파일 | 역할 |
|------|------|
| `we-raid-api/src/app.module.ts` | 루트 모듈 |
| `we-raid-api/src/common/prisma/` | PrismaService (Global) |
| `we-raid-api/src/common/cache/` | 인메모리 CacheService |
| `we-raid-api/src/common/filters/` | HttpExceptionFilter |
| `we-raid-api/src/common/interceptors/` | ResponseInterceptor |
| `we-raid-api/src/common/guards/` | JwtAuthGuard, RolesGuard, AdminGuard |
| `we-raid-api/src/common/decorators/` | @CurrentUser(), @ThrottleLogin() |
| `we-raid-api/prisma/schema.prisma` | DB 스키마 |

### 프론트엔드
| 파일 | 역할 |
|------|------|
| `we-raid-web/lib/api.ts` | axios 인스턴스 |
| `we-raid-web/store/auth.store.ts` | Zustand 인증 스토어 |
| `we-raid-web/auth.ts` | NextAuth 설정 |
| `we-raid-web/proxy.ts` | 미들웨어 |
| `we-raid-web/app/providers.tsx` | 글로벌 프로바이더 |

---

## 백엔드 미구현 항목 (스킵됨)

- 레이드 클리어 기록 (스키마 없음)
- Web Push / FCM
- 카카오 알림톡 발송
- 알림 발송 실패 재시도 (카카오 구현 시 함께)
- AWS S3 (현재 multer 로컬)
- Refresh Token (현재 7일 만료 단일 토큰)
