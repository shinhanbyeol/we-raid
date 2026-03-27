# We-Raid 개발 태스크 목록

> `[ ]` 미완료 &nbsp;|&nbsp; `[x]` 완료

---

## 환경 구성

- [x] 모노레포 루트 설정 (npm workspaces)
- [x] Docker Compose (PostgreSQL 16 + Redis 7)
- [x] Next.js 프로젝트 생성 (`we-raid-web`)
- [x] NestJS 프로젝트 생성 (`we-raid-api`)
- [x] Prisma 초기화 및 schema.prisma 작성
- [x] `prisma generate` 완료
- [x] `prisma migrate dev --name init` 실행
- [x] shadcn/ui 초기화 및 기본 컴포넌트 추가

---

## 백엔드

### 공통 인프라

- [x] PrismaService (Global Module)
- [x] JwtAuthGuard
- [x] RolesGuard
- [x] `@CurrentUser()` 데코레이터
- [x] Redis 연결 설정 → 인메모리 CacheService로 대체 (프로토타입)
- [x] 전역 예외 필터 (에러 코드 형식: `WR-{DOMAIN}-{CODE}`)
- [x] 전역 응답 인터셉터 (`{ data, message }` 형식)
- [x] Rate Limiting 설정 (전체 100req/min, 로그인 10req/min)

### 인증 (Auth)

> NextAuth(Auth.js v5)를 프론트엔드에서 사용하는 방향으로 전환. passport-kakao 불필요.

- [x] ~~카카오 OAuth 전략 (`passport-kakao`)~~ → NextAuth Kakao provider로 대체
- [x] JWT Access Token 전략 (`passport-jwt`) — JwtStrategy 구현
- [x] ~~`GET /auth/kakao`~~ → NextAuth가 처리
- [x] ~~`GET /auth/kakao/callback`~~ → NextAuth jwt callback + `POST /auth/sync`으로 대체
- [x] `POST /auth/sync` — NextAuth 콜백 후 사용자 동기화 및 백엔드 토큰 발급
- [x] ~~`POST /auth/refresh`~~ → NextAuth 세션이 관리 (프로토타입: 7일 만료 토큰)
- [x] ~~`POST /auth/logout`~~ → NextAuth signOut으로 처리
- [x] ~~Refresh Token Redis 저장~~ → 프로토타입 미구현
- [x] NextAuth 설정 (`auth.ts`, `proxy.ts`, route handler, SessionProvider)

### 사용자 (Users)

- [x] `GET /users/me` — 내 프로필 조회
- [x] `PATCH /users/me` — 닉네임 수정
- [x] `GET /users/:userId/characters` — 타 유저 캐릭터 조회 (specIsPublic 적용, mainChar 포함)
- [x] `GET /users/:userId/playable-times` — 타 유저 PT 조회 (같은 그룹원 권한 검증)

### 게임 (Games)

- [x] `GET /games` — 게임 목록 조회
- [x] `GET /games/:gameId/servers` — 게임별 서버 목록 조회
- [x] `GET /games/:gameId/event-types` — 게임별 이벤트 유형 조회

### 캐릭터 (Characters)

> 본캐/부캐 구분 기능 추가 (2026-03-27). `isMain`, `mainCharId` 필드 스키마 반영 완료.

- [x] `GET /characters` — 내 캐릭터 목록 (gameId·isMain 필터, mainChar·altChars 포함)
- [x] `POST /characters` — 캐릭터 생성 (`isMain`, `mainCharId` 검증 포함)
- [x] `PUT /characters/:id` — 캐릭터 수정 (본캐→부캐 변경 시 mainCharId null 자동처리)
- [x] `DELETE /characters/:id` — 캐릭터 소프트 삭제 (연결 부캐 mainCharId null 처리)
- [x] `POST /characters/:id/avatar` — 아바타 업로드 (multer 로컬, 최대 5MB) → S3 교체 예정
- [x] `POST /characters/:id/spec-image` — 스펙 이미지 업로드 (multer 로컬) → S3 교체 예정
- [x] 캐릭터 목록 응답에 `mainChar`, `altChars` 포함
- [ ] [FE] 캐릭터 등록 폼 — 본캐/부캐 선택 UI, 부캐 선택 시 같은 게임 본캐 드롭다운
- [ ] [FE] 캐릭터 카드 — 부캐에 본캐 정보 표시 (호버 툴팁 또는 카드 하단 "본캐: {닉네임}")

### 플레이 가능 시간 (PlayableTime)

- [x] `GET /playable-times` — 내 PT 목록 (인메모리 캐시 5분)
- [x] `POST /playable-times` — PT 일괄 등록 (최대 50개, 트랜잭션)
- [x] `PUT /playable-times/:id` — PT 수정
- [x] `DELETE /playable-times/:id` — PT 삭제
- [x] 인메모리 캐시 적용 (TTL 5분, 쓰기·삭제 시 무효화)

### 그룹 (Groups)

- [ ] `POST /groups` — 그룹 생성 (생성자 OWNER 자동 부여)
- [ ] `GET /groups/:id` — 그룹 상세 조회
- [ ] `GET /groups/:id/members` — 멤버 목록 조회
- [ ] `POST /groups/:id/invite` — 플랫폼 내 검색 초대
- [ ] `POST /groups/join/:inviteCode` — 초대 코드로 가입
- [ ] `PATCH /groups/:id/members/:userId` — 멤버 역할 변경 / 가입 승인
- [ ] `DELETE /groups/:id/members/:userId` — 멤버 강퇴

### 레이드 일정 (Schedules)

- [ ] `GET /schedules` — 내 일정 목록 (from, to, status 필터)
- [ ] `POST /schedules` — 일정 생성
- [ ] `GET /schedules/:id` — 일정 상세 (참여자 목록 포함)
- [ ] `PUT /schedules/:id` — 일정 수정 (리더 권한, 시간 변경 시 알림 발송)
- [ ] `DELETE /schedules/:id` — 일정 취소 (리더 권한, 전체 알림 발송)
- [ ] `POST /schedules/:id/participants` — 참여자 초대 (PENDING 생성, 알림 발송)
- [ ] `PATCH /schedules/:id/participants/me` — 참여 수락/거절
- [ ] 일정 충돌 감지 로직 (동일 userId, 시간 겹침 쿼리)
- [ ] 정원 초과 시 WAITLIST 자동 전환 + `Schedule.status = FULL`
- [ ] 대기열 → 참여 전환 알림 (자리 생기면 WAITLIST 순서대로)

### 알림 (Notifications)

- [ ] `GET /notifications` — 인앱 알림 목록
- [ ] `PATCH /notifications/:id/read` — 알림 읽음 처리
- [ ] `GET /notifications/stream` — SSE 연결 엔드포인트
- [ ] SSE 실시간 알림 전송 구현
- [ ] 카카오 알림톡 발송 모듈 (레이드 초대, 리마인더, 일정 변경/취소, 대기열 전환)
- [ ] 리마인더 Cron Job (D-1, 1시간 전)
- [ ] 알림 발송 실패 재시도 (3회, exponential backoff)

### 관리자 (Admin)

- [x] ADMIN 역할 가드 (`AdminGuard`, `User.isAdmin` 필드)
- [x] `POST /admin/games` — 게임 등록
- [x] `PUT /admin/games/:id` — 게임 수정
- [x] `DELETE /admin/games/:id` — 게임 비활성화 (isActive: false)
- [x] `POST /admin/games/:gameId/servers` — 서버 등록
- [x] `PUT /admin/games/:gameId/servers/:id` — 서버 수정
- [x] `DELETE /admin/games/:gameId/servers/:id` — 서버 삭제
- [x] `POST /admin/games/:gameId/event-types` — 이벤트 유형 등록
- [x] `GET /admin/users` — 유저 목록 조회
- [x] `PATCH /admin/users/:id/status` — 유저 상태 변경 (BANNED/ACTIVE)

### Should Have

- [ ] `GET /schedules/public` — 공개 모집 목록 (gameId, role 필터)
- [ ] `POST /schedules/:id/slots` — 포지션별 모집 정원(ScheduleSlot) 등록
- [ ] 반복 일정 (recurringRule RRULE 저장 및 rrule.js 파싱)
- [ ] 친구 추가/수락/차단 (`Friendship` CRUD)
- [ ] 레이드 클리어 기록 처리
- [ ] Web Push 발송 (FCM 연동)

---

## 프론트엔드

### 공통 인프라

- [x] axios 인스턴스 + 401 자동 토큰 갱신 인터셉터 (`lib/api.ts`)
- [x] QueryClientProvider (`app/providers.tsx`)
- [x] Zustand 인증 스토어 (`store/auth.store.ts`)
- [ ] shadcn/ui 기본 컴포넌트 설치 (button, input, card, badge, avatar, dialog, sheet, tabs)
- [ ] API 응답 타입 정의 (`lib/types/`)
- [ ] 커스텀 훅 — `useAuth`, `useCurrentUser`
- [ ] 인증 가드 레이아웃 (`app/(main)/layout.tsx`)

### 인증

- [ ] 로그인 페이지 (`app/(auth)/login/`) — 카카오 로그인 버튼, OG 태그
- [ ] 온보딩 스텝 (`app/(auth)/onboarding/`) — 닉네임 → 게임 → 캐릭터(서버 선택 포함) → PT
- [ ] 로그인 후 이전 페이지 리다이렉트 처리

### 홈 (대시보드)

- [ ] 오늘/이번 주 레이드 일정 카드 목록
- [ ] 미응답 초대 배지 + 최상단 표시
- [ ] 그룹 빠른 접근 목록

### 캐릭터 관리

- [ ] 캐릭터 목록 페이지
- [ ] 캐릭터 등록 폼 (게임 선택 → 서버 선택 → 역할 → 닉네임)
- [ ] 아바타 업로드 + `react-image-crop` 320×320 크롭 UI
- [ ] 스펙 텍스트 + 스펙 이미지 업로드

### 플레이 가능 시간 (PT)

- [ ] PT 주간 그리드 (월~일 × 시간대, 30분 단위)
- [ ] 드래그로 시간 선택 (When2meet 방식, 모바일 터치 지원)
- [ ] 캐릭터 연결 선택 UI

### 그룹 관리

- [ ] 그룹 생성 폼
- [ ] 멤버 리스트 + 역할 배지
- [ ] 가입 승인 요청 목록 (비공개 그룹)
- [ ] 초대 링크 복사 버튼

### 레이드 일정

- [ ] 일정 생성 멀티스텝 폼 (기본정보 → 포지션 → 인원 초대 → 확인)
- [ ] 인원 초대 스텝 — PT 히트맵 (겹치는 시간대 강조)
- [ ] 일정 충돌 경고 배지
- [ ] 일정 상세 페이지 — 포지션 현황 바 차트, 참여자 아바타 그리드
- [ ] 참여 수락/거절 UI
- [ ] 리더/참여자 UI 분기 (수정·취소·공지 버튼 권한별 노출)

### 마이페이지 캘린더

- [ ] 월/주/일 뷰 전환
- [ ] PT 연한 배경 + 레이드 일정 오버레이
- [ ] 일정 타입별 색상 구분

### 알림

- [ ] 알림 센터 (읽음/안읽음 목록)
- [ ] SSE 연결 + 실시간 알림 수신
- [ ] 알림 배지 (미읽음 카운트)

### 관리자 페이지

- [ ] `/admin` 경로 ADMIN 권한 가드
- [ ] 게임 목록 CRUD
- [ ] 서버 목록 관리 (게임별 서버 등록/수정/삭제)
- [ ] 이벤트 유형 관리
- [ ] 유저 관리 (상태 변경)

### Should Have

- [ ] 포지션별 모집 UI (ScheduleSlot)
- [ ] 일정 공지/댓글 UI
- [ ] 반복 일정 설정 UI
- [ ] PWA manifest 설정
- [ ] 반응형 모바일 최적화

---

## 인프라 / DevOps

- [ ] AWS S3 버킷 생성 + CloudFront 배포 설정
- [ ] `.env` 시크릿 실제 값 설정 (JWT, Kakao, S3)
- [ ] Sentry 연동 (프론트 + 백엔드)
- [ ] GitHub Actions CI 파이프라인 (PR 빌드 + 테스트)
- [ ] Vercel 프론트엔드 배포 설정
- [ ] AWS ECS Fargate 백엔드 배포 설정
- [ ] DB 인덱스 확인 (`Participant`, `PlayableTime`, `Schedule`, `Character`)
