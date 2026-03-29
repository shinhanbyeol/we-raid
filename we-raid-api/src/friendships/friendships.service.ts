import { Injectable, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import { AppException } from '../common/exceptions/app.exception'
import { CreateFriendshipDto } from './dto/create-friendship.dto'
import { QueryFriendshipDto } from './dto/query-friendship.dto'

const USER_SELECT = { id: true, nickname: true, profileImage: true }

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 친구 목록 조회 ───────────────────────────────────────────────────────────

  async getFriendships(userId: string, query: QueryFriendshipDto) {
    const status = query.status ?? 'ACCEPTED'

    const friendships = await this.prisma.friendship.findMany({
      where: {
        status,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: USER_SELECT },
        addressee: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 상대방 정보만 추출하여 응답
    return friendships.map((f) => ({
      id: f.id,
      status: f.status,
      createdAt: f.createdAt,
      isSentByMe: f.requesterId === userId,
      friend: f.requesterId === userId ? f.addressee : f.requester,
    }))
  }

  // ─── 친구 신청 ────────────────────────────────────────────────────────────────

  async sendRequest(userId: string, dto: CreateFriendshipDto) {
    if (userId === dto.addresseeId) {
      throw new AppException('WR-FRIEND-001', '자기 자신에게 친구 신청할 수 없습니다', HttpStatus.BAD_REQUEST)
    }

    const addressee = await this.prisma.user.findUnique({ where: { id: dto.addresseeId } })
    if (!addressee || addressee.status !== 'ACTIVE') {
      throw new AppException('WR-FRIEND-002', '유저를 찾을 수 없습니다', HttpStatus.NOT_FOUND)
    }

    // 양방향 중복 검사 (A→B 또는 B→A 모두 검사)
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: dto.addresseeId },
          { requesterId: dto.addresseeId, addresseeId: userId },
        ],
      },
    })
    if (existing) {
      if (existing.status === 'BLOCKED') {
        throw new AppException('WR-FRIEND-003', '차단된 관계입니다', HttpStatus.FORBIDDEN)
      }
      throw new AppException('WR-FRIEND-004', '이미 친구 관계이거나 신청 중입니다', HttpStatus.CONFLICT)
    }

    return this.prisma.friendship.create({
      data: { requesterId: userId, addresseeId: dto.addresseeId },
      include: {
        addressee: { select: USER_SELECT },
      },
    })
  }

  // ─── 친구 요청 수락 ───────────────────────────────────────────────────────────

  async acceptRequest(userId: string, requesterId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId, addresseeId: userId } },
    })
    if (!friendship) throw new AppException('WR-FRIEND-005', '친구 요청을 찾을 수 없습니다', HttpStatus.NOT_FOUND)
    if (friendship.status !== 'PENDING') {
      throw new AppException('WR-FRIEND-006', '수락할 수 없는 상태입니다', HttpStatus.BAD_REQUEST)
    }

    return this.prisma.friendship.update({
      where: { requesterId_addresseeId: { requesterId, addresseeId: userId } },
      data: { status: 'ACCEPTED' },
      include: { requester: { select: USER_SELECT } },
    })
  }

  // ─── 차단 ─────────────────────────────────────────────────────────────────────

  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new AppException('WR-FRIEND-007', '자기 자신을 차단할 수 없습니다', HttpStatus.BAD_REQUEST)
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    })

    if (existing) {
      // 기존 관계를 BLOCKED로 업데이트 (requesterId = 차단한 사람으로 변경)
      return this.prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: userId,
          addresseeId: targetUserId,
          status: 'BLOCKED',
        },
        include: { addressee: { select: USER_SELECT } },
      })
    }

    // 기존 관계 없으면 새로 생성
    return this.prisma.friendship.create({
      data: { requesterId: userId, addresseeId: targetUserId, status: 'BLOCKED' },
      include: { addressee: { select: USER_SELECT } },
    })
  }

  // ─── 친구 삭제 / 요청 거절 ────────────────────────────────────────────────────

  async removeFriendship(userId: string, targetUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: { not: 'BLOCKED' },
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    })
    if (!friendship) throw new AppException('WR-FRIEND-008', '친구 관계를 찾을 수 없습니다', HttpStatus.NOT_FOUND)

    await this.prisma.friendship.delete({ where: { id: friendship.id } })
  }
}
