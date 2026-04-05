import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

const MEMBER_WITH_USER = {
  id: true,
  role: true,
  status: true,
  joinedAt: true,
  user: { select: { id: true, nickname: true, profileImage: true } },
};

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        group: {
          include: {
            game: { select: { id: true, name: true, slug: true } },
            _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map(({ group, role }) => ({
      ...group,
      memberCount: group._count.members,
      myRole: role,
    }));
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId, isActive: true },
    });
    if (!game)
      throw new AppException(
        'WR-GROUP-001',
        '게임을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          gameId: dto.gameId,
          ownerId: userId,
          description: dto.description,
          isPublic: dto.isPublic ?? false,
        },
        include: {
          game: { select: { id: true, name: true, slug: true } },
          owner: { select: { id: true, nickname: true, profileImage: true } },
        },
      });

      await tx.groupMember.create({
        data: { groupId: group.id, userId, role: 'OWNER', status: 'ACTIVE' },
      });

      return group;
    });
  }

  async getGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        game: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, nickname: true, profileImage: true } },
        _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      },
    });
    if (!group)
      throw new AppException(
        'WR-GROUP-002',
        '그룹을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );

    if (!group.isPublic) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new AppException(
          'WR-GROUP-003',
          '비공개 그룹은 멤버만 조회할 수 있습니다',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return group;
  }

  async getMembers(userId: string, groupId: string) {
    await this.assertActiveMember(userId, groupId);

    return this.prisma.groupMember.findMany({
      where: { groupId, status: 'ACTIVE' },
      select: MEMBER_WITH_USER,
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  async inviteMember(userId: string, groupId: string, dto: InviteMemberDto) {
    await this.assertLeaderOrOwner(userId, groupId);

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!targetUser || targetUser.status !== 'ACTIVE') {
      throw new AppException(
        'WR-GROUP-004',
        '유저를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: dto.userId } },
    });
    if (existing)
      throw new AppException(
        'WR-GROUP-005',
        '이미 그룹에 속한 유저입니다',
        HttpStatus.CONFLICT,
      );

    return this.prisma.groupMember.create({
      data: { groupId, userId: dto.userId, role: 'MEMBER', status: 'ACTIVE' },
      select: MEMBER_WITH_USER,
    });
  }

  async joinByInviteCode(userId: string, inviteCode: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode },
      include: { game: { select: { id: true, name: true, slug: true } } },
    });
    if (!group)
      throw new AppException(
        'WR-GROUP-006',
        '유효하지 않은 초대 코드입니다',
        HttpStatus.NOT_FOUND,
      );

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing)
      throw new AppException(
        'WR-GROUP-007',
        '이미 그룹에 속한 유저입니다',
        HttpStatus.CONFLICT,
      );

    const member = await this.prisma.groupMember.create({
      data: { groupId: group.id, userId, role: 'MEMBER', status: 'ACTIVE' },
      select: MEMBER_WITH_USER,
    });

    return {
      group: { id: group.id, name: group.name, game: group.game },
      member,
    };
  }

  async updateMember(
    userId: string,
    groupId: string,
    targetUserId: string,
    dto: UpdateMemberDto,
  ) {
    await this.assertOwner(userId, groupId);

    const target = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!target || target.status !== 'ACTIVE') {
      throw new AppException(
        'WR-GROUP-008',
        '그룹 멤버를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }
    if (target.role === 'OWNER') {
      throw new AppException(
        'WR-GROUP-009',
        'OWNER 역할은 변경할 수 없습니다',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: dto.role },
      select: MEMBER_WITH_USER,
    });
  }

  async removeMember(userId: string, groupId: string, targetUserId: string) {
    const requester = await this.assertActiveMember(userId, groupId);

    const target = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!target || target.status !== 'ACTIVE') {
      throw new AppException(
        'WR-GROUP-010',
        '그룹 멤버를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }
    if (target.role === 'OWNER') {
      throw new AppException(
        'WR-GROUP-011',
        'OWNER는 강퇴할 수 없습니다',
        HttpStatus.FORBIDDEN,
      );
    }

    if (userId !== targetUserId) {
      if (requester.role === 'MEMBER') {
        throw new AppException(
          'WR-GROUP-012',
          '강퇴 권한이 없습니다',
          HttpStatus.FORBIDDEN,
        );
      }
      if (requester.role === 'SUB_LEADER' && target.role === 'SUB_LEADER') {
        throw new AppException(
          'WR-GROUP-013',
          'SUB_LEADER는 다른 SUB_LEADER를 강퇴할 수 없습니다',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    await this.assertOwner(userId, groupId);

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        game: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, nickname: true, profileImage: true } },
        _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      },
    });
  }

  async deleteGroup(userId: string, groupId: string) {
    await this.assertOwner(userId, groupId);

    await this.prisma.$transaction(async (tx) => {
      // 스케줄 groupId 해제 (스케줄 데이터는 보존)
      await tx.schedule.updateMany({
        where: { groupId },
        data: { groupId: null },
      });
      // 멤버 전체 삭제
      await tx.groupMember.deleteMany({ where: { groupId } });
      // 그룹 삭제
      await tx.group.delete({ where: { id: groupId } });
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async assertActiveMember(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group)
      throw new AppException(
        'WR-GROUP-002',
        '그룹을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new AppException(
        'WR-GROUP-003',
        '그룹 멤버가 아닙니다',
        HttpStatus.FORBIDDEN,
      );
    }
    return member;
  }

  private async assertLeaderOrOwner(userId: string, groupId: string) {
    const member = await this.assertActiveMember(userId, groupId);
    if (member.role === 'MEMBER') {
      throw new AppException(
        'WR-GROUP-014',
        '리더 이상 권한이 필요합니다',
        HttpStatus.FORBIDDEN,
      );
    }
    return member;
  }

  private async assertOwner(userId: string, groupId: string) {
    const member = await this.assertActiveMember(userId, groupId);
    if (member.role !== 'OWNER') {
      throw new AppException(
        'WR-GROUP-015',
        'OWNER 권한이 필요합니다',
        HttpStatus.FORBIDDEN,
      );
    }
    return member;
  }
}
