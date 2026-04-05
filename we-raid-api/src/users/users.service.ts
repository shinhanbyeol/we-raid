import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const CHARACTER_BASE = {
  id: true,
  nickname: true,
  avatarUrl: true,
  role: true,
  isMain: true,
  serverName: true,
  isVerified: true,
  isDeleted: true,
  game: { select: { id: true, name: true, slug: true } },
  mainChar: { select: { id: true, nickname: true, avatarUrl: true } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return user;
  }

  async completeOnboarding(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { boarded: true },
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { nickname: dto.nickname },
    });
    if (exists && exists.id !== userId)
      throw new ConflictException('WR-USER-001', '이미 사용 중인 닉네임입니다');

    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname: dto.nickname },
    });
  }

  async getUserCharacters(requesterId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException();

    const isOwner = requesterId === targetUserId;
    const characters = await this.prisma.character.findMany({
      where: { userId: targetUserId, isDeleted: false },
      select: {
        ...CHARACTER_BASE,
        specText: true,
        specImageUrl: true,
        specIsPublic: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    return characters.map(({ specIsPublic, ...char }) => ({
      ...char,
      specText: isOwner || specIsPublic ? char.specText : null,
      specImageUrl: isOwner || specIsPublic ? char.specImageUrl : null,
    }));
  }

  async getUserPlayableTimes(requesterId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException();

    if (requesterId !== targetUserId) {
      const sharedGroup = await this.prisma.groupMember.findFirst({
        where: {
          status: 'ACTIVE',
          group: {
            members: {
              some: { userId: requesterId, status: 'ACTIVE' },
            },
          },
          userId: targetUserId,
        },
      });
      if (!sharedGroup)
        throw new ForbiddenException(
          'WR-USER-002',
          '같은 그룹원만 조회할 수 있습니다',
        );
    }

    return this.prisma.playableTime.findMany({
      where: { userId: targetUserId },
      include: {
        character: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }
}
