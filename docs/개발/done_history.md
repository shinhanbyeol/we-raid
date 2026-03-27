# Done History

## 2026-03-27
- shadcn/ui 스킬 설치(`pnpm dlx skills add shadcn/ui`) 및 `we-raid-web` 초기화 완료 (Tailwind v4, style: base-nova)
- DB를 PostgreSQL → SQLite로 전환(프로토타입), `prisma migrate dev --name init` 완료 (Json 필드 → String으로 변경)
- 백엔드 공통 인프라: 인메모리 CacheService, 전역 예외 필터(WR-DOMAIN-CODE), 응답 인터셉터({ data, message }), Rate Limiting(전체 100/min, 로그인용 ThrottleLogin 데코레이터 10/min)
- 인증: NextAuth(Auth.js v5) 도입, Kakao provider, jwt callback → POST /auth/sync(백엔드 사용자 동기화+JWT 발급), proxy.ts 라우트 보호, SessionProvider, axios Bearer 토큰 주입
- 기획 수정: 캐릭터 본캐/부캐 구분 기능 추가 — schema(isMain, mainCharId, AltToMain 자기참조), 기획서 4.2 업데이트, 마이그레이션 완료
- Users API: GET /users/me, PATCH /users/me(닉네임 중복 검증), GET /users/:id/characters(specIsPublic+mainChar), GET /users/:id/playable-times(그룹원 권한)
- Games API: GET /games, GET /games/:id/servers, GET /games/:id/event-types
- Characters API: CRUD + 이미지 업로드(multer 로컬), 본캐/부캐 검증 로직(mainChar 연결·해제·cascade null)
- PlayableTime API: GET(캐시 5분), POST 일괄등록(최대 50개·트랜잭션), PUT, DELETE / 캐시 무효화, 시간순서·캐릭터 소유 검증
- Admin API: AdminGuard(isAdmin), 게임 CRUD(비활성화), 서버 CRUD, 이벤트유형 등록, 유저 목록/상태변경
