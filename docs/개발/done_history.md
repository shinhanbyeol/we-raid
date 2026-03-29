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

## 2026-03-29
- Groups API: POST /groups(그룹 생성·OWNER 자동 부여), GET /groups/:id(비공개 멤버 권한), GET /groups/:id/members, POST /groups/:id/invite(OWNER·SUB_LEADER), POST /groups/join/:inviteCode(초대코드 가입), PATCH /groups/:id/members/:userId(역할 변경·OWNER 전용), DELETE /groups/:id/members/:userId(강퇴·탈퇴) / 에러코드 WR-GROUP-001~015
- Schedules API: GET /schedules(from·to·status 필터), POST /schedules(생성·리더 ACCEPTED 자동), GET /schedules/:id(참여자 목록 포함), PUT /schedules/:id(리더 권한·시간 변경 시 SCHEDULE_CHANGED 알림), DELETE /schedules/:id(취소·SCHEDULE_CANCELLED 전체 알림), POST /schedules/:id/participants(초대·PENDING 생성·RAID_INVITE 알림), PATCH /schedules/:id/participants/me(수락/거절) / 에러코드 WR-SCHED-001~015
  - 일정 충돌 감지: 수락 시 동일 userId ACCEPTED 일정과 시간 겹침 쿼리 (WR-SCHED-014)
  - 정원 초과 WAITLIST 자동 전환 + Schedule.status = FULL
  - 거절 시 WAITLIST 1순위 → PENDING 승격 + WAITLIST_PROMOTED 알림, Schedule.status FULL → OPEN 복원
  - 알림은 prisma.notification.create/createMany로 DB 저장 (SSE·카카오 연동은 알림 모듈 구현 시 예정)
- Should Have 백엔드 구현:
  - GET /schedules/public — 공개 모집 목록 (groupId=null, status OPEN/FULL, gameId·role 필터)
  - POST /schedules/:id/slots — 포지션별 슬롯 등록 (리더 전용, 기존 슬롯 전체 대체 방식)
  - 반복 일정(RRULE): CreateScheduleDto·UpdateScheduleDto에 recurringRule 추가, rrule.js로 유효성 검증(WR-SCHED-016), getSchedule 응답에 다음 10회 발생 일자(recurringOccurrences) 포함
  - Friendships API: GET /friendships(status 필터), POST /friendships(친구 신청), PATCH /friendships/:requesterId/accept(수락), PATCH /friendships/:userId/block(차단), DELETE /friendships/:userId(삭제·거절) / 양방향 중복 검사, 에러코드 WR-FRIEND-001~008
  - 스킵: 레이드 클리어 기록(스키마 없음), Web Push/FCM(외부 서비스 설정 필요)
- 알림(Notifications) API:
  - SseService: userId별 Subject 맵으로 SSE 연결 관리, push()/subscribe()/disconnect()
  - NotificationsService: notify()/notifyMany() — DB 저장 + SSE 실시간 전송 통합, NotificationsModule에서 export
  - GET /notifications (최신 50개 + unreadCount), PATCH /notifications/:id/read, GET /notifications/stream (SSE)
  - RemindersTask: @nestjs/schedule Cron(*/15 * * * *) — D-1(±15분), 1시간 전(±15분) 윈도우로 리마인더 발송, 중복 방지(payload contains 체크)
  - SchedulesService: prisma.notification 직접 호출 → NotificationsService.notify/notifyMany 교체(SSE 실시간 연동)
  - 스킵: 카카오 알림톡(나중에), 알림 발송 실패 재시도(카카오 구현 시 함께)
