# We-Raid 서비스 기획 및 개발 명세서

> **버전:** v1.0 | **도메인:** www.we-raid.com  
> **목적:** 개발자가 We-Raid 서비스를 이해하고 구현하기 위한 기획 + 기술 명세  
> **대상:** 프론트엔드 / 백엔드 / 풀스택 개발자, 기술 리드

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [기술 스택 및 인프라](#2-기술-스택-및-인프라)
3. [데이터 모델](#3-데이터-모델-erd-설명)
4. [기능 명세](#4-기능-명세-feature-spec)
5. [알림 시스템](#5-알림-시스템)
6. [API 설계](#6-api-설계-restful)
7. [주요 화면 및 UX 흐름](#7-주요-화면-및-ux-흐름)
8. [개발 우선순위 및 로드맵](#8-개발-우선순위-및-로드맵)
9. [보안 및 운영 고려사항](#9-보안-및-운영-고려사항)
10. [개발 환경 및 코드 컨벤션](#10-개발-환경-및-코드-컨벤션)
11. [미결 이슈 및 결정 필요 사항](#11-미결-이슈-및-결정-필요-사항)

---

## 1. 서비스 개요

### 1.1 배경 및 문제 정의

온라인 게임(아이온2, 월드오브워크래프트, 로스트아크 등)에서 다인원 레이드 콘텐츠는 보통 4~40명의 플레이어가 특정 시간에 함께 접속해야 진행 가능합니다. 바쁜 직장인 게이머들은 각자의 스케줄이 불규칙하고 여러 캐릭터·여러 게임을 병행하는 경우가 많아 일정 조율에 심각한 비효율이 발생합니다.

**현재 일정 조율 방식의 문제점:**

- 단체 카카오톡 채팅방에서 '언제 가능?'을 일일이 묻고 답하는 방식
- 엑셀/구글 시트로 수동 취합 — 업데이트 누락 및 버전 불일치
- 다른 레이드 일정과 겹쳤을 때 인지하지 못해 노쇼(No-show) 발생
- 캐릭터 스펙 확인 불편 — 스크린샷을 채팅방에 공유해야 함

### 1.2 서비스 목표

- 플레이 가능 시간(PT) 기반 자동 시간대 추천으로 '언제 가능?'을 없앤다
- 레이드 일정 충돌을 시스템이 자동으로 감지하여 노쇼를 방지한다
- 캐릭터 스펙 인증을 플랫폼에서 관리하여 영입 신뢰도를 높인다
- 그룹(길드) 단위 조직 관리와 역할별 모집을 지원한다

### 1.3 핵심 사용자 (Persona)

| 구분 | 공대장 (레이드 리더) | 공대원 (레이드 참여자) |
|------|------|------|
| 주요 니즈 | 이번 주 레이드 가능한 인원과 시간을 한눈에 파악 | 내 가능 시간 등록 후 자동으로 일정이 맞춰지길 원함 |
| Pain Point | 인원 파악에 30분 이상 소요, 일정 노쇼 반복 | 여러 레이드 일정 중복 신청, 스펙 인증 번거로움 |
| 핵심 기능 | PT 기반 시간대 추천, 역할별 모집, 알림 발송 | PT 등록, 일정 응답, 캐릭터 스펙 관리 |

### 1.4 지원 게임 (초기)

- **로스트아크** — 어비스 레이드, 군단장 레이드 등
- **월드오브워크래프트 (WoW)** — 일반/영웅/신화 레이드
- **아이온2** — 인던, 공성전 등
- **기타** — 관리자가 게임을 추가 등록 가능한 확장형 구조

> ⚠️ 게임별 이벤트 유형, 서버 목록, 역할 태그는 관리자 Config로 관리하여 코드 수정 없이 확장 가능해야 합니다.

---

## 2. 기술 스택 및 인프라

| 영역 | 선택 기술 | 선택 이유 |
|------|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript | SSR/SSG 혼용, SEO, PWA 지원, 파일 기반 라우팅 |
| 상태 관리 | Zustand + React Query (TanStack) | 서버 상태와 클라이언트 상태 분리 관리 |
| UI 라이브러리 | Tailwind CSS + shadcn/ui | 빠른 UI 구성, 커스터마이징 용이 |
| 이미지 처리 | react-image-crop (클라이언트 크롭) | 아바타 320x320 크롭 UI, 서버 업로드 전 로컬 처리 |
| 백엔드 | NestJS (Node.js) + TypeScript | 모듈 구조, DI 컨테이너, 유지보수성 |
| 데이터베이스 | PostgreSQL + Prisma ORM | 관계형 데이터 구조, 타입 안전 쿼리 |
| 캐시/세션 | Redis | 세션 토큰, PT 조회 캐시, 알림 큐 |
| 인증 | 카카오 OAuth 2.0 + JWT (Access/Refresh Token) | 요구사항 명시. Refresh Token은 Redis 저장 |
| 파일 저장소 | AWS S3 + CloudFront CDN | 아바타/스펙 인증 이미지, CDN 캐시로 빠른 로딩 |
| 알림 | 카카오 알림톡 + Web Push (FCM) | 카카오 계정 기반 서비스 특성, 브라우저 푸시 병행 |
| 실시간 | Server-Sent Events (SSE) — MVP | 단방향 알림에 충분. 추후 WebSocket 전환 검토 |
| 배포 | Vercel (FE) + AWS ECS Fargate (BE) | 프론트 엣지 배포, 백엔드 컨테이너 오토스케일링 |
| CI/CD | GitHub Actions | PR 빌드/테스트 자동화, 배포 파이프라인 |

---

## 3. 데이터 모델 (ERD 설명)

### 3.1 핵심 엔티티

| 엔티티 | 주요 필드 | 관계 설명 |
|------|------|------|
| **User** | id, kakaoId, nickname, profileImage, createdAt, status(ACTIVE/BANNED/DELETED) | 1명의 User는 N개의 Character, N개의 PlayableTime, N개의 Group 보유 |
| **Game** | id, name, slug, thumbnailUrl, isActive, config(JSON) | 1개의 Game에 N개의 Character, N개의 EventType, N개의 GameServer 연결 |
| **Character** | id, userId, gameId, **serverName**, nickname, avatarUrl, role(TANK/HEAL/DPS/SUPPORT/ETC), **isMain**, **mainCharId**, specText, specImageUrl, isVerified | User와 Game의 교차 엔티티. isMain=true이면 본캐, false이면 부캐. 부캐는 mainCharId로 본캐 Character를 참조(nullable). 일정 매칭 시 서버 필터링에 사용 |
| **GameServer** | id, gameId, name, region(KR/NA/EU/ETC), isActive, displayOrder | 게임별 서버 목록. 관리자가 등록/관리. isActive=false이면 선택 불가(서버 종료 대응) |
| **PlayableTime** | id, userId, characterId(nullable), dayOfWeek(0-6), startTime, endTime, timezone, isRecurring | characterId null이면 계정 전체 PT, 있으면 특정 캐릭터 PT |
| **Group** | id, name, gameId, ownerId, description, isPublic, inviteCode, createdAt | Game에 종속. 1개의 Group은 1개의 Game만 선택. inviteCode로 링크 초대 지원 |
| **GroupMember** | id, groupId, userId, role(OWNER/SUB_LEADER/MEMBER), joinedAt, status(ACTIVE/BANNED) | Group-User 다대다 중간 테이블. 권한 관리 포함 |
| **Schedule** | id, title, leaderId, leaderTitle, gameId, groupId(nullable), eventTypeId, startAt, endAt, maxParticipants, status(DRAFT/OPEN/FULL/CLOSED/CANCELLED), recurringRule(JSON), description | 레이드 일정 본체. recurringRule에 RRULE 형식 저장 |
| **ScheduleSlot** | id, scheduleId, role(TANK/HEAL/DPS/SUPPORT/ANY), count, filledCount | 포지션별 모집 정원 관리. 탱커 2명, 힐러 3명 형태 |
| **Participant** | id, scheduleId, userId, characterId, slotId, status(PENDING/ACCEPTED/DECLINED/WAITLIST), respondedAt, invitedBy | 초대/참가 신청 이력. WAITLIST는 정원 초과 시 자동 전환 |
| **EventType** | id, gameId(nullable), name, description, isDefault | 게임별 이벤트 유형. gameId null이면 공용 유형 |
| **Notification** | id, userId, type, title, body, isRead, payload(JSON), createdAt | 인앱 알림 히스토리. payload에 scheduleId 등 딥링크 데이터 포함 |
| **Friendship** | id, requesterId, addresseeId, status(PENDING/ACCEPTED/BLOCKED), createdAt | User 간 친구 관계. 양방향 조회를 위해 양쪽 컬럼 인덱스 필요 |

### 3.2 중요 설계 결정

**PlayableTime의 캐릭터 연결**
- `characterId` null → 해당 User의 전체 가용 시간 (어느 캐릭터든 플레이 가능)
- `characterId` 있음 → 특정 캐릭터만 플레이 가능한 시간
- 일정 초대 시 두 가지를 모두 조회하여 UI에 표시해야 함

**Schedule.recurringRule**
- iCalendar RFC 5545의 RRULE 형식으로 JSON 저장
- 예: `FREQ=WEEKLY;BYDAY=WE;BYHOUR=21`
- 백엔드에서 `rrule.js` 라이브러리로 파싱 및 인스턴스 생성

**일정 충돌 감지 로직**
```sql
-- 동일 userId의 시간 겹침 조회
SELECT * FROM participants p
JOIN schedules s ON p.schedule_id = s.id
WHERE p.user_id = :userId
  AND p.status = 'ACCEPTED'
  AND s.start_at < :newEndAt
  AND s.end_at > :newStartAt
```
> 충돌 시 초대 화면에 경고 표시. 강제 참여는 허용(사용자 판단에 맡김)

**GameServer 관리**
- 서버 목록은 관리자가 GameServer 테이블에 등록
- `Character.serverName`은 GameServer.name 참조 (FK 또는 string 저장 중 선택)
- 일정 생성 시 리더의 캐릭터 서버와 일치하는 참여자만 필터링 가능

---

## 4. 기능 명세 (Feature Spec)

> ★ 표시는 MVP 이후 추가 개발 권장 기능

### 4.1 인증 (Authentication)

#### 카카오 OAuth 소셜 로그인

| 항목 | 설명 |
|------|------|
| 흐름 | ① 카카오 로그인 버튼 클릭 → ② 카카오 OAuth 인증 → ③ 백엔드 JWT 발급(Access + Refresh) → ④ 신규 사용자면 닉네임 설정 페이지로 리다이렉트 |
| Access Token | 유효기간 1시간. HTTP-Only Cookie 또는 메모리 저장 (localStorage 사용 금지) |
| Refresh Token | 유효기간 30일. Redis 저장 (키: `refresh:{userId}`). 재발급 시 기존 토큰 무효화(Rotation) |
| 신규 가입 처리 | 카카오 kakaoId 기준으로 신규/기존 판단. 신규이면 User 레코드 생성 + 닉네임 설정 온보딩 |
| 탈퇴 처리 ★ | User.status = DELETED 처리(소프트 삭제). 개인정보는 30일 후 완전 삭제 배치 처리 |

---

### 4.2 캐릭터 관리

| 항목 | 상세 명세 |
|------|------|
| 게임 선택 | 관리자가 등록한 게임 목록을 그리드/리스트로 표시. 검색 기능 포함 |
| 닉네임 | 게임 내 캐릭터 닉네임. 최대 30자 |
| **서버(Server)** | **캐릭터가 속한 게임 서버 선택 또는 직접 입력. 서버 목록은 GameServer 테이블에서 게임별 로드. 예) 로스트아크: 아브렐슈드·카제로스 / WoW: 아즈샤라·버나딘. 같은 게임이라도 서버가 다르면 함께 레이드 불가이므로 일정 매칭 시 서버 일치 여부 필터링에 사용** |
| **본캐 / 부캐 구분** | **캐릭터 등록 시 본캐(isMain: true) 또는 부캐(isMain: false)로 구분. 부캐 등록 시 동일 게임 내 본캐를 선택하여 연결(mainCharId). 본캐 미선택도 허용.** |
| **부캐 → 본캐 표시** | **타 유저 또는 내 캐릭터 목록에서 부캐 프로필 표시 시, 연결된 본캐 정보를 마우스 호버 시 툴팁으로 표시하거나 프로필 카드 하단에 작게 "본캐: {닉네임}" 형태로 상시 노출. 본캐가 미연결인 경우 미표시.** |
| 역할(Role) | TANK / HEAL / DPS / SUPPORT / ETC 중 선택. 일정 포지션 모집과 연결됨 |
| 아바타 등록 | 게임 스크린샷 업로드 → 클라이언트에서 react-image-crop으로 320x320 크롭 → WebP 변환 후 S3 업로드. 원본 최대 10MB |
| 스펙 정보 | ① `specText`: 자유 텍스트 최대 500자 / ② `specImageUrl`: 스펙 인증 스크린샷 최대 5MB |
| 스펙 공개 설정 | 그룹원/친구에게만 공개 또는 전체 공개 선택 가능 |

---

### 4.3 플레이 가능 시간 (PT) 관리

| 항목 | 상세 명세 |
|------|------|
| 입력 단위 | 요일(월~일) + 시작시간 + 종료시간. 30분 단위 슬롯으로 UI 구성 |
| 캐릭터 연결 | 이 시간에 어느 캐릭터로 플레이 가능한지 연결 가능. 미선택 시 전체 캐릭터 가능 |
| 반복 설정 ★ | '매주 반복' 또는 '특정 날짜만' 선택 |
| 타임존 ★ | 기본값 Asia/Seoul. DB 저장은 UTC, 표시는 로컬 타임존 |
| 주간 템플릿 ★ | 이번 주 PT를 다음 주에도 동일하게 적용하는 원클릭 복사 기능 |
| PT 조회 (타 유저) | 초대 화면에서 초대 대상자의 PT를 히트맵으로 시각화. 겹치는 시간대 강조 표시 |

---

### 4.4 그룹 관리

| 항목 | 상세 명세 |
|------|------|
| 그룹 생성 | 그룹명, 연결 게임 선택, 공개/비공개 설정. 생성자는 자동으로 OWNER 부여 |
| 역할 체계 | OWNER: 모든 권한 / SUB_LEADER: 멤버 초대·승인 권한 / MEMBER: 일반 멤버 |
| 초대 방식 | ① 플랫폼 내 검색 초대 ② inviteCode 링크 생성 (유효기간 7일) |
| 가입 승인 | 비공개 그룹은 OWNER/SUB_LEADER가 승인. 공개 그룹은 자동 승인 |
| 그룹 공개/비공개 ★ | 공개 그룹은 서비스 내 검색 가능. 비공개는 링크가 있어야만 접근 가능 |

---

### 4.5 레이드 일정 관리 (핵심 기능)

#### 4.5.1 일정 생성

| 필드 | 명세 및 비즈니스 규칙 |
|------|------|
| 제목 | 필수. 최대 60자 |
| 게임 | 필수. 연결 게임 선택 (리더의 등록 캐릭터 기준 게임 목록 우선 표시) |
| 이벤트 유형 | 필수. 게임별 사전 정의 유형(레이드, PvP 등) 또는 직접 입력 |
| 리더 호칭 | 선택. 최대 10자. 기본값 '공대장'. 자유 입력 허용 |
| 일시 | 날짜 + 시작시간 + 예상 종료시간 필수. 종료시간은 충돌 감지에 사용 |
| 최대 인원 | 전체 최대 인원 설정 |
| 포지션별 모집 ★ | ScheduleSlot으로 관리. 예) 탱커 1, 힐러 2, DPS 5 |
| 그룹 연결 | 선택. 그룹 일정으로 생성 시 그룹원에게 알림 발송 |
| 반복 일정 ★ | 매주 반복 시 recurringRule에 RRULE 저장 |
| 공개 모집 ★ | 서비스 내 다른 유저에게 공개 모집. 게임·역할·스펙 기준 필터 제공 |

#### 4.5.2 참여자 초대 및 응답 플로우

| 단계 | 상세 |
|------|------|
| 초대 대상 선택 | 그룹원 또는 친구 목록에서 다중 선택. 이미 초대된 사람 비활성화 표시 |
| PT 확인 UI | 대상자 선택 후 겹치는 PT를 히트맵으로 시각화 |
| 충돌 경고 | 다른 레이드 일정과 겹치면 경고 배지 표시. 강제 차단은 없음 |
| Participant 생성 | 초대 즉시 status=PENDING으로 레코드 생성. 초대받은 사람에게 알림 발송 |
| 응답 처리 | ACCEPTED / DECLINED 선택. 미응답 시 PENDING 유지 |
| 정원 초과 처리 | ACCEPTED 수가 maxParticipants 도달 시 이후 응답은 자동 WAITLIST 전환. Schedule.status = FULL |
| 대기열 → 참여 전환 | 자리 생기면 WAITLIST 중 가장 먼저 응답한 사람에게 알림 발송 후 24시간 내 확인 요청 |
| 초대 권한 위임 | 리더가 특정 참여자에게 초대 권한 부여 가능 |

#### 4.5.3 일정 상세 화면

- 참여자 목록 (역할별 현황 바 차트로 시각화)
- 공지사항/메모 ★: 리더가 공지 작성 시 참여자 전원에게 알림
- 댓글 ★: 참여자 간 텍스트 소통
- 일정 수정: 리더만 가능. 시간 변경 시 모든 ACCEPTED 참여자에게 알림
- 일정 취소: 리더만 가능. 모든 참여자에게 알림
- 클리어 기록 ★: 레이드 완료 후 리더가 '클리어 완료' 처리. 참여자 히스토리에 기록

---

## 5. 알림 시스템

| 알림 트리거 | 채널 | 메시지 예시 |
|------|------|------|
| 레이드 초대 수신 | 인앱 + 카카오 알림톡 | [닉네임]님이 '카오스던전 레이드'에 초대했습니다. |
| 참여자 수락/거절 | 인앱 | [닉네임]님이 초대를 수락했습니다. |
| 일정 D-1 리마인더 | 인앱 + 카카오 알림톡 | 내일 오후 9시 '카오스던전 레이드'가 예정되어 있습니다. |
| 일정 1시간 전 리마인더 | 인앱 + Web Push | 1시간 후 레이드가 시작됩니다. 지금 접속 준비하세요! |
| 일정 변경/취소 | 인앱 + 카카오 알림톡 | [공대장명]이 일정을 변경했습니다. |
| 대기열 전환 알림 | 인앱 + 카카오 알림톡 | 자리가 생겼습니다! 24시간 내 확인해주세요. |
| 그룹 초대 | 인앱 | [닉네임]님이 '[그룹명]' 그룹에 초대했습니다. |
| PT 기반 자동 매칭 ★ | 인앱 | 내 PT와 일치하는 공개 레이드 모집이 있습니다. |

**구현 방식**
- 인앱 알림: DB 저장 + SSE 스트림으로 실시간 전달
- 카카오 알림톡: Kakao Biz Message API 연동
- Web Push: FCM(Firebase Cloud Messaging) 연동
- 발송 실패: 3회 재시도 (exponential backoff). 최종 실패는 에러 로그 저장

---

## 6. API 설계 (RESTful)

**Base URL:** `https://api.we-raid.com/v1`  
**인증:** `Authorization: Bearer {accessToken}` 헤더 사용

### 6.1 인증

| Method | Endpoint | Auth | 설명 |
|------|------|------|------|
| GET | /auth/kakao | X | 카카오 OAuth 리다이렉트 URL 반환 |
| GET | /auth/kakao/callback | X | 카카오 콜백 처리, JWT 발급 후 프론트 리다이렉트 |
| POST | /auth/refresh | Refresh Token | Access Token 재발급 |
| POST | /auth/logout | O | Redis Refresh Token 삭제 |

### 6.2 캐릭터

| Method | Endpoint | Auth | 설명 |
|------|------|------|------|
| GET | /characters | O | 내 캐릭터 목록 조회 (gameId 필터 가능) |
| POST | /characters | O | 캐릭터 생성 (serverName, role 포함) |
| PUT | /characters/:id | O | 캐릭터 수정 |
| DELETE | /characters/:id | O | 캐릭터 삭제 (소프트 삭제) |
| POST | /characters/:id/avatar | O | 아바타 이미지 업로드 (multipart/form-data) |
| POST | /characters/:id/spec-image | O | 스펙 인증 이미지 업로드 |
| GET | /users/:userId/characters | O | 타 유저 캐릭터 조회 (스펙 공개 설정 적용) |

### 6.3 게임 서버

| Method | Endpoint | Auth | 설명 |
|------|------|------|------|
| GET | /games/:gameId/servers | O | 게임별 서버 목록 조회 (캐릭터 등록 시 사용) |
| POST | /admin/games/:gameId/servers | ADMIN | 서버 등록 |
| PUT | /admin/games/:gameId/servers/:id | ADMIN | 서버 수정 (이름, region, isActive) |
| DELETE | /admin/games/:gameId/servers/:id | ADMIN | 서버 삭제 |

### 6.4 플레이 가능 시간

| Method | Endpoint | Auth | 설명 |
|------|------|------|------|
| GET | /playable-times | O | 내 PT 목록 조회 |
| POST | /playable-times | O | PT 생성 (복수 슬롯 일괄 등록 지원) |
| PUT | /playable-times/:id | O | PT 수정 |
| DELETE | /playable-times/:id | O | PT 삭제 |
| GET | /users/:userId/playable-times | O | 특정 유저 PT 조회 (친구/그룹원만) |

### 6.5 일정

| Method | Endpoint | Auth | 설명 |
|------|------|------|------|
| GET | /schedules | O | 내 일정 목록 (?from=&to=&status=) |
| POST | /schedules | O | 일정 생성 |
| GET | /schedules/:id | O | 일정 상세 조회 (참여자 목록 포함) |
| PUT | /schedules/:id | O (리더) | 일정 수정 (시간 변경 시 알림 자동 발송) |
| DELETE | /schedules/:id | O (리더) | 일정 취소 |
| POST | /schedules/:id/participants | O | 참여자 초대 |
| PATCH | /schedules/:id/participants/me | O | 내 참여 상태 변경 (ACCEPTED/DECLINED) |
| GET | /schedules/public ★ | O | 공개 모집 목록 (gameId, role 필터) |

---

## 7. 주요 화면 및 UX 흐름

| 페이지 | 핵심 UI 요소 | UX 주의사항 |
|------|------|------|
| 랜딩/로그인 | 서비스 소개, 카카오 로그인 버튼 | SNS 미리보기 OG 태그 필수. 로그인 후 이전 페이지로 리다이렉트 |
| 온보딩 (신규) | 닉네임 설정 → 게임 선택 → 첫 캐릭터 등록(**서버 선택 포함**) → PT 등록 | 스텝 건너뛰기 허용. 온보딩 미완료 재방문 시 이어하기 유도 |
| 홈 (대시보드) | 오늘/이번 주 레이드 일정 카드, 미응답 초대 배지, 그룹 빠른 접근 | 미응답 초대를 최상단에 표시해 응답률 향상 |
| 일정 생성 | 멀티스텝 폼: 기본정보 → 포지션 설정 → 인원 초대 → 확인 | 각 스텝 완료 시 자동 임시저장. 인원 초대 스텝에서 PT 히트맵 표시 |
| 일정 상세 | 포지션 현황 바, 참여자 아바타 그리드, 공지사항, 댓글 ★ | 리더와 일반 참여자 UI 분기. 리더에게만 수정/취소/공지 버튼 노출 |
| 캘린더 (마이페이지) | 월/주/일 뷰 전환, 일정 타입별 색상, PT 배경 표시 | PT를 연한 배경색으로 깔고 레이드 일정을 오버레이 |
| PT 등록 | 주간 그리드 (월~일 × 시간대), 드래그로 시간 선택 | When2meet 방식 참고. 모바일 터치 드래그 지원 필수 |
| 그룹 관리 | 멤버 리스트, 역할 배지, 가입 승인 요청, 초대 링크 복사 | 그룹장/부그룹장/멤버 권한별 UI 분기 필요 |
| 관리자 페이지 | 게임 목록 CRUD, **서버 목록 관리**, 이벤트 유형 관리, 유저 관리, 통계 ★ | /admin 경로, ADMIN 역할 미들웨어 가드 필수 |

---

## 8. 개발 우선순위 및 로드맵

### 8.1 MoSCoW 우선순위

**Must Have**
카카오 OAuth 로그인/회원가입 · 게임 선택 · 캐릭터 등록(닉네임, **서버**, 역할, 아바타 크롭, 스펙) · PT 등록(요일+시간, 캐릭터 연결) · 그룹 생성/초대/승인 · 일정 생성(제목, 게임, 이벤트유형, 일시, 인원) · 참여자 초대(PT 히트맵 + 충돌경고) · 참여 수락/거절/대기열 · 인앱 알림 · 카카오 알림톡(초대, 리마인더) · 마이페이지 캘린더 · 관리자 게임/서버 CRUD

**Should Have**
포지션별 모집(ScheduleSlot) · 일정 공지/댓글 · 반복 일정 · 대기열 자동 전환 알림 · 친구 추가 · 초대 링크(inviteCode) · Web Push · 레이드 클리어 기록 · 참여 히스토리

**Could Have**
공개 모집(외부 영입) · 외부 캘린더 연동(구글 캘린더) · 타임존 설정 · 주간 PT 템플릿 복사 · PT 기반 자동 매칭 알림 · 관리자 통계 대시보드 · 레이드 전략 메모

**Won't Have (v1)**
실시간 채팅(WebSocket) · 전투력 자동 파싱 API · 랭킹 시스템 · 결제/프리미엄 기능 · 네이티브 앱(iOS/Android)

### 8.2 스프린트 계획 (2주 단위)

| 스프린트 | 기간 | 백엔드 | 프론트엔드 |
|------|------|------|------|
| S1 | Week 1-2 | DB 스키마, 카카오 OAuth + JWT, User/Game/Character CRUD | 프로젝트 셋업(Next.js), 로그인, 온보딩 스텝 1~2 |
| S2 | Week 3-4 | PlayableTime CRUD, **GameServer API**, 아바타/스펙 S3 업로드, Group CRUD + 권한 | 캐릭터 등록 폼(**서버 선택 UI**), PT 주간 그리드, 그룹 관리 |
| S3 | Week 5-6 | Schedule CRUD, Participant 초대/응답, 충돌 감지, 대기열 처리 | 일정 생성 멀티스텝 폼, PT 히트맵, 일정 상세 |
| S4 | Week 7-8 | 알림 시스템(SSE + 알림톡), 관리자 API, 리마인더 Cron | 홈 대시보드, 마이페이지 캘린더, 알림 센터, 관리자 페이지 |
| S5 | Week 9-10 | 포지션별 모집, 공지/댓글, 반복 일정, 성능 최적화 | Should Have UI, 반응형 모바일, PWA manifest |
| S6 | Week 11-12 | 보안 점검(OWASP), API 문서화(Swagger), 스테이징 배포 | UI/UX 개선, E2E 테스트, 베타 출시 준비 |

---

## 9. 보안 및 운영 고려사항

### 9.1 보안

- JWT Secret은 256비트 이상 랜덤 키. 환경 변수(.env)로 관리, 코드 하드코딩 금지
- 이미지 업로드: MIME 타입 검증(Content-Type 헤더 + Magic Bytes 모두 확인), 파일 크기 제한 서버사이드 적용
- Rate Limiting: API 전체 IP당 분당 100 req, 로그인 API는 IP당 분당 10 req
- 카카오 알림톡 API 키, S3 자격증명 등 모든 시크릿은 AWS Secrets Manager 또는 환경 변수로 관리
- SQL Injection: Prisma ORM의 파라미터화 쿼리 사용 (raw query 사용 시 검증 필수)
- XSS: Next.js의 기본 이스케이프 활용, `dangerouslySetInnerHTML` 사용 금지
- 관리자 페이지(/admin): IP Allowlist 또는 별도 인증 레이어 추가 권장

### 9.2 성능

- PT 조회 (다수 유저 PT 한 번에 조회): Redis 캐시 적용 (TTL 5분, PT 변경 시 무효화)
- 이미지 CDN: S3 + CloudFront. 아바타 이미지는 320x320 고정이므로 CDN 캐시 히트율 높음
- 데이터베이스 인덱스 필수: `Participant(scheduleId, userId)`, `PlayableTime(userId, dayOfWeek)`, `Schedule(startAt, groupId)`, `Character(userId, gameId)`
- N+1 쿼리 방지: Prisma include로 관계 데이터 일괄 로드

### 9.3 모니터링

- 에러 트래킹: Sentry (프론트 + 백엔드)
- API 응답시간, 에러율 모니터링: AWS CloudWatch 또는 Datadog
- 알림 발송 성공/실패율 대시보드
- 주요 비즈니스 지표: 일정 생성 수, 참여 응답률, PT 등록 유저 비율

---

## 10. 개발 환경 및 코드 컨벤션

### 10.1 프로젝트 구조

**프론트엔드 (Next.js App Router)**

```
we-raid-web/
├── app/
│   ├── (auth)/           # 로그인, 온보딩 (비인증 레이아웃)
│   ├── (main)/           # 홈, 일정, 그룹, 마이페이지 (인증 레이아웃)
│   └── admin/            # 관리자 페이지
├── components/
│   ├── ui/               # shadcn/ui 기반 공통 컴포넌트
│   ├── schedule/         # 일정 관련 컴포넌트
│   ├── character/        # 캐릭터 관련 컴포넌트 (서버 선택 포함)
│   └── pt/               # PT 히트맵, 그리드 컴포넌트
├── lib/
│   ├── api.ts            # API 클라이언트 (axios 래퍼)
│   └── hooks/            # 커스텀 훅
└── store/                # Zustand 스토어
```

**백엔드 (NestJS)**

```
we-raid-api/
├── src/
│   ├── auth/             # JWT, 카카오 OAuth 전략
│   ├── users/            # User 모듈
│   ├── characters/       # Character 모듈 (serverName 포함)
│   ├── games/            # Game, EventType, GameServer 모듈
│   ├── groups/           # Group, GroupMember 모듈
│   ├── schedules/        # Schedule, Participant, ScheduleSlot 모듈
│   ├── playable-times/   # PlayableTime 모듈
│   ├── notifications/    # 알림 모듈 (인앱 + 카카오 + Push)
│   ├── admin/            # 관리자 모듈
│   └── common/           # Guards, Decorators, Interceptors
├── prisma/
│   └── schema.prisma
└── test/
```

### 10.2 코드 컨벤션

| 항목 | 규칙 |
|------|------|
| 언어 | TypeScript strict 모드. `any` 사용 금지. 모든 API 응답 타입 정의 필수 |
| API 응답 형식 | 성공: `{ data: T, message: string }` / 실패: `{ error: string, code: string }` |
| 날짜/시간 | DB 저장: UTC / API 송수신: ISO 8601 / 프론트 표시: 로컬 타임존 변환 (date-fns-tz) |
| 에러 코드 | `WR-AUTH-001`, `WR-SCHED-001` 등 도메인 코드 prefix로 구분 |
| 브랜치 전략 | `main` ← `develop` ← `feature/{description}`. PR은 최소 1명 리뷰 필수 |
| 커밋 메시지 | Conventional Commits: `feat(character): add server selection field` |

---

## 11. 미결 이슈 및 결정 필요 사항

| # | 이슈 | 배경 | 우선순위 |
|------|------|------|------|
| 1 | 플랫폼 전략 (웹 전용 vs PWA) | 바쁜 직장인은 모바일 접근이 많음. PWA로 설치형 경험 제공 가능 | 착수 전 결정 필수 |
| 2 | 카카오 알림톡 발송 주체 | 카카오 비즈니스 계정 및 알림톡 채널 사전 등록 필요 (심사 2~4주 소요) | 착수 전 결정 필수 |
| 3 | 스펙 인증 검증 방식 | 현재: 자유 텍스트 + 스크린샷. 추후 게임 API 연동(로스트아크 API 등) 자동 인증 검토 | v2 검토 |
| 4 | 캐릭터 역할 태그 게임별 커스텀 | WoW는 탱/딜/힐, 로스트아크는 세부 클래스. GameServer처럼 Config로 관리할지 결정 필요 | S2 전 결정 |
| 5 | **GameServer 초기 데이터 입력 주체** | **관리자가 수동 등록 vs 게임사 공식 데이터 크롤링. 서버명 오타/누락 시 캐릭터 등록 오류 발생** | **S2 전 결정** |
| 6 | 서비스 약관 및 개인정보처리방침 | 카카오 OAuth 사용 시 개인정보 처리 동의 필수. 법무 검토 필요 | 베타 출시 전 필수 |
| 7 | 도메인 및 SSL 인증서 | www.we-raid.com 도메인 구매 및 AWS Route 53 등록, ACM SSL 인증서 발급 필요 | 베타 출시 전 필수 |

---

*We-Raid 서비스 기획 및 개발 명세서 v1.0 | 내부 배포용*
