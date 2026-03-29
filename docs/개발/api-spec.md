# We-Raid API 명세

> 프론트엔드 개발용. 모든 요청은 `Authorization: Bearer {token}` 헤더 필요 (auth/sync 제외).
> Base URL: `http://localhost:3001/v1`
>
> 성공 응답: `{ "data": T, "message": "ok" }`
> 에러 응답: `{ "code": "WR-XXX-NNN", "message": "...", "path": "..." }`

---

## 공통 타입

```typescript
// Enums
type UserStatus = 'ACTIVE' | 'BANNED' | 'DELETED'
type CharacterRole = 'TANK' | 'HEAL' | 'DPS' | 'SUPPORT' | 'ETC'
type Region = 'KR' | 'NA' | 'EU' | 'ETC'
type GroupMemberRole = 'OWNER' | 'SUB_LEADER' | 'MEMBER'
type GroupMemberStatus = 'ACTIVE' | 'BANNED'
type ScheduleStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'
type ParticipantStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WAITLIST'
type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED'
type NotificationType =
  | 'RAID_INVITE' | 'INVITE_ACCEPTED' | 'INVITE_DECLINED'
  | 'SCHEDULE_REMINDER' | 'SCHEDULE_CHANGED' | 'SCHEDULE_CANCELLED'
  | 'WAITLIST_PROMOTED' | 'GROUP_INVITE' | 'PT_MATCH'
```

---

## Auth

### `POST /auth/sync` — NextAuth 콜백 후 사용자 동기화
> 인증 불필요. NextAuth jwt callback에서 내부적으로 호출됨.

**Request Body:**
```typescript
{
  kakaoId: string
  nickname: string
  profileImage?: string
}
```

**Response:**
```typescript
{
  accessToken: string
  user: {
    id: string
    kakaoId: string
    nickname: string
    profileImage: string | null
    status: UserStatus
    isAdmin: boolean
    createdAt: string
  }
}
```

---

## Users

### `GET /users/me` — 내 프로필 조회

**Response:**
```typescript
{
  id: string
  kakaoId: string
  nickname: string
  profileImage: string | null
  status: UserStatus
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}
```

### `PATCH /users/me` — 닉네임 수정

**Request Body:**
```typescript
{
  nickname: string  // 2~20자
}
```

**Response:** User 객체

### `GET /users/:userId/characters` — 타 유저 캐릭터 조회
> `specIsPublic: true`인 캐릭터만 반환. mainChar 포함.

**Response:** `Character[]` (아래 캐릭터 타입 참조)

### `GET /users/:userId/playable-times` — 타 유저 PT 조회
> 같은 그룹원만 조회 가능. 아니면 403.

**Response:** `PlayableTime[]`

---

## Games

### `GET /games` — 게임 목록 조회

**Response:**
```typescript
{
  id: string
  name: string
  slug: string
  thumbnailUrl: string | null
  isActive: boolean
  config: string  // JSON string
  createdAt: string
}[]
```

### `GET /games/:gameId/servers` — 게임별 서버 목록

**Response:**
```typescript
{
  id: string
  gameId: string
  name: string
  region: Region
  isActive: boolean
  displayOrder: number
}[]
```

### `GET /games/:gameId/event-types` — 게임별 이벤트 유형

**Response:**
```typescript
{
  id: string
  gameId: string | null
  name: string
  description: string | null
  isDefault: boolean
}[]
```

---

## Characters

### `GET /characters` — 내 캐릭터 목록

**Query:**
```typescript
{
  gameId?: string
  isMain?: boolean  // 'true' | 'false' 문자열로 전송
}
```

**Response:**
```typescript
{
  id: string
  userId: string
  gameId: string
  serverId: string | null
  serverName: string
  nickname: string
  avatarUrl: string | null
  role: CharacterRole
  isMain: boolean
  mainCharId: string | null
  specText: string | null
  specImageUrl: string | null
  isVerified: boolean
  specIsPublic: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  mainChar: Character | null   // isMain=false인 경우 연결된 본캐
  altChars: Character[]        // isMain=true인 경우 연결된 부캐 목록
}[]
```

### `POST /characters` — 캐릭터 생성

**Request Body:**
```typescript
{
  gameId: string
  serverId?: string           // GameServer ID
  serverName: string          // 최대 50자
  nickname: string            // 최대 30자
  role: CharacterRole
  isMain?: boolean            // 기본 true
  mainCharId?: string         // 부캐(isMain=false)인 경우 본캐 ID
  specText?: string           // 최대 500자
  specIsPublic?: boolean      // 기본 true
}
```

**Response:** Character 객체

### `PUT /characters/:id` — 캐릭터 수정

**Request Body:** (모두 optional)
```typescript
{
  serverId?: string
  serverName?: string
  nickname?: string
  role?: CharacterRole
  isMain?: boolean
  mainCharId?: string | null  // null 전달 시 본캐 연결 해제
  specText?: string
  specIsPublic?: boolean
}
```

**Response:** Character 객체

### `DELETE /characters/:id` — 캐릭터 삭제
**Response:** 204 No Content

### `POST /characters/:id/avatar` — 아바타 업로드
**Content-Type:** `multipart/form-data`
**Field:** `file` (image/*, 최대 5MB)

**Response:**
```typescript
{ avatarUrl: string }
```

### `POST /characters/:id/spec-image` — 스펙 이미지 업로드
**Content-Type:** `multipart/form-data`
**Field:** `file` (image/*, 최대 5MB)

**Response:**
```typescript
{ specImageUrl: string }
```

---

## Playable Times (PT)

**PT 객체 타입:**
```typescript
{
  id: string
  userId: string
  characterId: string | null
  dayOfWeek: number     // 0=일, 1=월, ..., 6=토
  startTime: string     // "HH:mm"
  endTime: string       // "HH:mm"
  timezone: string      // 기본 "Asia/Seoul"
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}
```

### `GET /playable-times` — 내 PT 목록 (캐시 5분)
**Response:** `PlayableTime[]`

### `POST /playable-times` — PT 일괄 등록 (최대 50개)

**Request Body:**
```typescript
{
  items: {
    characterId?: string
    dayOfWeek: number     // 0~6
    startTime: string     // "HH:mm"
    endTime: string       // "HH:mm"
    timezone?: string     // 기본 "Asia/Seoul"
    isRecurring?: boolean // 기본 true
  }[]
}
```

**Response:** `PlayableTime[]`

### `PUT /playable-times/:id` — PT 수정

**Request Body:** (모두 optional)
```typescript
{
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  timezone?: string
  isRecurring?: boolean
}
```

**Response:** `PlayableTime`

### `DELETE /playable-times/:id` — PT 삭제
**Response:** 204 No Content

---

## Groups

**Group 객체 타입:**
```typescript
{
  id: string
  name: string
  gameId: string
  ownerId: string
  description: string | null
  isPublic: boolean
  inviteCode: string
  createdAt: string
  updatedAt: string
}

type GroupMember = {
  id: string
  groupId: string
  userId: string
  role: GroupMemberRole
  status: GroupMemberStatus
  joinedAt: string
  user: { id: string; nickname: string; profileImage: string | null }
}
```

### `POST /groups` — 그룹 생성 (생성자 OWNER 자동 부여)

**Request Body:**
```typescript
{
  name: string          // 2~30자
  gameId: string
  description?: string  // 최대 200자
  isPublic?: boolean    // 기본 false
}
```

**Response:** Group 객체

### `POST /groups/join/:inviteCode` — 초대 코드로 가입
**Response:** GroupMember 객체

### `GET /groups/:id` — 그룹 상세 조회
> 비공개 그룹은 멤버만 조회 가능.

**Response:** Group 객체 + `{ memberCount: number }`

### `GET /groups/:id/members` — 멤버 목록

**Response:** `GroupMember[]`

### `POST /groups/:id/invite` — 플랫폼 내 유저 초대
> OWNER 또는 SUB_LEADER만 가능.

**Request Body:**
```typescript
{ userId: string }
```

**Response:** GroupMember 객체

### `PATCH /groups/:id/members/:userId` — 멤버 역할 변경
> OWNER만 가능. 변경 가능한 역할: SUB_LEADER, MEMBER.

**Request Body:**
```typescript
{ role: 'SUB_LEADER' | 'MEMBER' }
```

**Response:** GroupMember 객체

### `DELETE /groups/:id/members/:userId` — 강퇴 / 탈퇴
> OWNER·SUB_LEADER는 타인 강퇴 가능. 본인은 탈퇴 가능.

**Response:** 204 No Content

---

## Schedules

**Schedule 객체 타입:**
```typescript
{
  id: string
  title: string
  leaderId: string
  leaderTitle: string
  gameId: string
  groupId: string | null
  eventTypeId: string | null
  startAt: string       // ISO 8601
  endAt: string         // ISO 8601
  maxParticipants: number
  status: ScheduleStatus
  recurringRule: string | null   // RRULE 문자열
  description: string | null
  createdAt: string
  updatedAt: string
}

type Participant = {
  id: string
  scheduleId: string
  userId: string
  characterId: string | null
  slotId: string | null
  status: ParticipantStatus
  respondedAt: string | null
  invitedById: string | null
  createdAt: string
  user: { id: string; nickname: string; profileImage: string | null }
  character: Character | null
}

type ScheduleSlot = {
  id: string
  scheduleId: string
  role: CharacterRole
  count: number
  filledCount: number
}
```

### `GET /schedules` — 내 일정 목록

**Query:**
```typescript
{
  from?: string     // ISO 8601
  to?: string       // ISO 8601
  status?: 'DRAFT' | 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'
}
```

**Response:** `Schedule[]`

### `GET /schedules/public` — 공개 모집 목록
> groupId=null, status=OPEN|FULL인 일정.

**Query:**
```typescript
{
  gameId?: string
  role?: CharacterRole   // 해당 역할 슬롯이 있는 일정만
}
```

**Response:** `Schedule[]`

### `POST /schedules` — 일정 생성

**Request Body:**
```typescript
{
  title: string           // 최대 60자
  gameId: string
  groupId?: string
  eventTypeId?: string
  startAt: string         // ISO 8601
  endAt: string           // ISO 8601
  maxParticipants: number // 최소 1
  description?: string    // 최대 500자
  leaderTitle?: string    // 기본 "공대장", 최대 20자
  recurringRule?: string  // RRULE 문자열 (예: "FREQ=WEEKLY;BYDAY=SA,SU")
}
```

**Response:** Schedule 객체

### `GET /schedules/:id` — 일정 상세 (참여자 포함)

**Response:**
```typescript
Schedule & {
  participants: Participant[]
  slots: ScheduleSlot[]
  recurringOccurrences?: string[]  // 다음 10회 발생 일자 (반복 일정인 경우)
}
```

### `PUT /schedules/:id` — 일정 수정
> 리더 권한 필요. 시간 변경 시 참여자에게 SCHEDULE_CHANGED 알림 발송.

**Request Body:** (모두 optional)
```typescript
{
  title?: string
  startAt?: string
  endAt?: string
  maxParticipants?: number
  description?: string
  leaderTitle?: string
  recurringRule?: string  // null이면 반복 해제
}
```

**Response:** Schedule 객체

### `DELETE /schedules/:id` — 일정 취소
> 리더 권한 필요. 전체 참여자에게 SCHEDULE_CANCELLED 알림 발송.

**Response:** 204 No Content

### `POST /schedules/:id/slots` — 포지션 슬롯 등록
> 리더 권한 필요. 기존 슬롯 전체 대체.

**Request Body:**
```typescript
{
  slots: {
    role: CharacterRole
    count: number  // 최소 1
  }[]
}
```

**Response:** `ScheduleSlot[]`

### `POST /schedules/:id/participants` — 참여자 초대
> PENDING 생성 + RAID_INVITE 알림 발송.

**Request Body:**
```typescript
{
  userId: string
  characterId?: string
  slotId?: string
}
```

**Response:** Participant 객체

### `PATCH /schedules/:id/participants/me` — 참여 수락/거절

**Request Body:**
```typescript
{ status: 'ACCEPTED' | 'DECLINED' }
```

**ACCEPTED 시 동작:**
- 일정 충돌(겹치는 ACCEPTED 일정) 있으면 409 (WR-SCHED-014)
- 정원 초과 시 WAITLIST로 자동 전환, Schedule.status = FULL
- 거절 또는 탈퇴 시 WAITLIST 1순위 → PENDING 승격 + WAITLIST_PROMOTED 알림

**Response:** Participant 객체

---

## Notifications

### `GET /notifications` — 알림 목록

**Response:**
```typescript
{
  items: {
    id: string
    userId: string
    type: NotificationType
    title: string
    body: string
    isRead: boolean
    payload: string   // JSON string (scheduleId 등 포함)
    createdAt: string
  }[]
  unreadCount: number
}
```

### `GET /notifications/stream` — SSE 실시간 알림
> EventSource로 연결. 연결 유지하면 새 알림 실시간 수신.

```typescript
// 클라이언트 사용 예시
const es = new EventSource('/v1/notifications/stream', {
  headers: { Authorization: `Bearer ${token}` }
})
es.onmessage = (event) => {
  const notification = JSON.parse(event.data)
  // notification: Notification 객체
}
```

**Note:** 표준 EventSource는 커스텀 헤더 미지원. fetch 기반 SSE 클라이언트(@microsoft/fetch-event-source 등) 또는 쿼리 파라미터로 토큰 전달 필요.

### `PATCH /notifications/:id/read` — 읽음 처리

**Response:** Notification 객체

---

## Friendships

**Friendship 객체 타입:**
```typescript
{
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  createdAt: string
  requester: { id: string; nickname: string; profileImage: string | null }
  addressee: { id: string; nickname: string; profileImage: string | null }
}
```

### `GET /friendships` — 친구 목록

**Query:**
```typescript
{ status?: 'PENDING' | 'ACCEPTED' | 'BLOCKED' }  // 기본: ACCEPTED
```

**Response:** `Friendship[]`

### `POST /friendships` — 친구 신청

**Request Body:**
```typescript
{ addresseeId: string }
```

**Response:** Friendship 객체 (status: PENDING)

### `PATCH /friendships/:requesterId/accept` — 친구 요청 수락

**Response:** Friendship 객체 (status: ACCEPTED)

### `PATCH /friendships/:userId/block` — 유저 차단

**Response:** Friendship 객체 (status: BLOCKED)

### `DELETE /friendships/:userId` — 친구 삭제 / 요청 거절
**Response:** 204 No Content

---

## Admin (isAdmin: true 유저만)

### `POST /admin/games` — 게임 등록
```typescript
{
  name: string        // 최대 50자
  slug: string        // URL 슬러그, 영소문자+하이픈, 최대 30자
  thumbnailUrl?: string
  config?: string     // JSON string
}
```

### `PUT /admin/games/:id` — 게임 수정
```typescript
{
  name?: string
  slug?: string
  thumbnailUrl?: string
  config?: string
  isActive?: boolean
}
```

### `DELETE /admin/games/:id` — 게임 비활성화 (isActive: false)
**Response:** 204 No Content

### `POST /admin/games/:gameId/servers` — 서버 등록
```typescript
{
  name: string          // 최대 50자
  region?: Region       // 기본 KR
  displayOrder?: number // 기본 0
}
```

### `PUT /admin/games/:gameId/servers/:id` — 서버 수정
```typescript
{
  name?: string
  region?: Region
  displayOrder?: number
  isActive?: boolean
}
```

### `DELETE /admin/games/:gameId/servers/:id`
**Response:** 204 No Content

### `POST /admin/games/:gameId/event-types` — 이벤트 유형 등록
```typescript
{
  name: string          // 최대 50자
  description?: string  // 최대 200자
  isDefault?: boolean
}
```

### `GET /admin/users` — 유저 목록
**Response:** `User[]`

### `PATCH /admin/users/:id/status` — 유저 상태 변경
```typescript
{ status: 'ACTIVE' | 'BANNED' }
```

---

## 주요 에러 코드 목록

### Groups (WR-GROUP-NNN)
| 코드 | 상황 |
|------|------|
| WR-GROUP-001 | 게임을 찾을 수 없음 |
| WR-GROUP-002 | 그룹을 찾을 수 없음 |
| WR-GROUP-003 | 비공개 그룹 — 멤버가 아님 |
| WR-GROUP-004 | 초대 권한 없음 (OWNER·SUB_LEADER만) |
| WR-GROUP-005 | 이미 그룹 멤버임 |
| WR-GROUP-006 | 유효하지 않은 초대 코드 |
| WR-GROUP-007 | 역할 변경 권한 없음 (OWNER만) |
| WR-GROUP-008 | OWNER는 역할 변경 불가 |
| WR-GROUP-009 | 강퇴 권한 없음 |
| WR-GROUP-010 | 멤버를 찾을 수 없음 |

### Schedules (WR-SCHED-NNN)
| 코드 | 상황 |
|------|------|
| WR-SCHED-001 | 게임을 찾을 수 없음 |
| WR-SCHED-002 | 그룹을 찾을 수 없음 |
| WR-SCHED-003 | 일정을 찾을 수 없음 |
| WR-SCHED-004 | 수정 권한 없음 (리더만) |
| WR-SCHED-005 | 취소 권한 없음 (리더만) |
| WR-SCHED-006 | 이미 취소된 일정 |
| WR-SCHED-007 | 초대할 유저를 찾을 수 없음 |
| WR-SCHED-008 | 이미 초대됨 또는 참여 중 |
| WR-SCHED-009 | 응답할 초대를 찾을 수 없음 |
| WR-SCHED-010 | 이미 처리된 초대 |
| WR-SCHED-011 | 슬롯 등록 권한 없음 |
| WR-SCHED-012 | 취소된 일정에는 슬롯 불가 |
| WR-SCHED-013 | 캐릭터 소유권 없음 |
| WR-SCHED-014 | 일정 충돌 (동일 시간 ACCEPTED 일정 존재) |
| WR-SCHED-015 | 취소된 일정에는 초대 불가 |
| WR-SCHED-016 | 잘못된 RRULE 형식 |

### Friendships (WR-FRIEND-NNN)
| 코드 | 상황 |
|------|------|
| WR-FRIEND-001 | 자기 자신에게 신청 불가 |
| WR-FRIEND-002 | 이미 친구 관계 존재 |
| WR-FRIEND-003 | 친구 요청을 찾을 수 없음 |
| WR-FRIEND-004 | 수락 권한 없음 (수신자만) |
| WR-FRIEND-005 | 이미 처리된 요청 |
| WR-FRIEND-006 | 차단 대상을 찾을 수 없음 |
| WR-FRIEND-007 | 친구 관계를 찾을 수 없음 |
| WR-FRIEND-008 | 삭제 권한 없음 |
