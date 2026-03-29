// ============================================================
// Enums
// ============================================================

export type UserStatus = 'ACTIVE' | 'BANNED' | 'DELETED'
export type CharacterRole = 'TANK' | 'HEAL' | 'DPS' | 'SUPPORT' | 'ETC'
export type Region = 'KR' | 'NA' | 'EU' | 'ETC'
export type GroupMemberRole = 'OWNER' | 'SUB_LEADER' | 'MEMBER'
export type GroupMemberStatus = 'ACTIVE' | 'BANNED'
export type ScheduleStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'
export type ParticipantStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WAITLIST'
export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED'
export type NotificationType =
  | 'RAID_INVITE'
  | 'INVITE_ACCEPTED'
  | 'INVITE_DECLINED'
  | 'SCHEDULE_REMINDER'
  | 'SCHEDULE_CHANGED'
  | 'SCHEDULE_CANCELLED'
  | 'WAITLIST_PROMOTED'
  | 'GROUP_INVITE'
  | 'PT_MATCH'

// ============================================================
// API Wrapper
// ============================================================

export interface ApiResponse<T> {
  data: T
  message: string
}

export interface ApiError {
  code: string
  message: string
  path: string
}

// ============================================================
// User
// ============================================================

export interface User {
  id: string
  kakaoId: string
  nickname: string
  profileImage: string | null
  status: UserStatus
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================
// Game
// ============================================================

export interface Game {
  id: string
  name: string
  slug: string
  thumbnailUrl: string | null
  isActive: boolean
  config: string
  createdAt: string
}

export interface GameServer {
  id: string
  gameId: string
  name: string
  region: Region
  isActive: boolean
  displayOrder: number
}

export interface EventType {
  id: string
  gameId: string | null
  name: string
  description: string | null
  isDefault: boolean
}

// ============================================================
// Character
// ============================================================

export interface Character {
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
  mainChar: Character | null
  altChars: Character[]
}

// ============================================================
// PlayableTime (PT)
// ============================================================

export interface PlayableTime {
  id: string
  userId: string
  characterId: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  timezone: string
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================
// Group
// ============================================================

export interface Group {
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

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupMemberRole
  status: GroupMemberStatus
  joinedAt: string
  user: {
    id: string
    nickname: string
    profileImage: string | null
  }
}

// ============================================================
// Schedule
// ============================================================

export interface ScheduleSlot {
  id: string
  scheduleId: string
  role: CharacterRole
  count: number
  filledCount: number
}

export interface Participant {
  id: string
  scheduleId: string
  userId: string
  characterId: string | null
  slotId: string | null
  status: ParticipantStatus
  respondedAt: string | null
  invitedById: string | null
  createdAt: string
  user: {
    id: string
    nickname: string
    profileImage: string | null
  }
  character: Character | null
}

export interface Schedule {
  id: string
  title: string
  leaderId: string
  leaderTitle: string
  gameId: string
  groupId: string | null
  eventTypeId: string | null
  startAt: string
  endAt: string
  maxParticipants: number
  status: ScheduleStatus
  recurringRule: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ScheduleDetail extends Schedule {
  participants: Participant[]
  slots: ScheduleSlot[]
  recurringOccurrences?: string[]
}

// ============================================================
// Notification
// ============================================================

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  payload: string
  createdAt: string
}

export interface NotificationList {
  items: Notification[]
  unreadCount: number
}

// ============================================================
// Friendship
// ============================================================

export interface Friendship {
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  createdAt: string
  requester: {
    id: string
    nickname: string
    profileImage: string | null
  }
  addressee: {
    id: string
    nickname: string
    profileImage: string | null
  }
}

// ============================================================
// Auth
// ============================================================

export interface AuthSyncResponse {
  accessToken: string
  user: Pick<User, 'id' | 'kakaoId' | 'nickname' | 'profileImage' | 'status' | 'isAdmin' | 'createdAt'>
}
