import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { QueryCharacterDto } from './dto/query-character.dto';

const CHAR_SELECT = {
  id: true,
  nickname: true,
  avatarUrl: true,
  role: true,
  isMain: true,
  serverName: true,
  specText: true,
  specImageUrl: true,
  specIsPublic: true,
  isVerified: true,
  createdAt: true,
  game: { select: { id: true, name: true, slug: true } },
  server: { select: { id: true, name: true, region: true } },
  mainChar: { select: { id: true, nickname: true, avatarUrl: true } },
  altChars: {
    where: { isDeleted: false },
    select: { id: true, nickname: true, avatarUrl: true, role: true },
  },
};

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCharacters(userId: string, query: QueryCharacterDto) {
    return this.prisma.character.findMany({
      where: {
        userId,
        isDeleted: false,
        ...(query.gameId ? { gameId: query.gameId } : {}),
        ...(query.isMain !== undefined ? { isMain: query.isMain } : {}),
      },
      select: CHAR_SELECT,
      orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateCharacterDto) {
    const isMain = dto.isMain ?? true;

    if (dto.mainCharId) {
      if (isMain)
        throw new BadRequestException(
          'WR-CHAR-001',
          '본캐에는 mainCharId를 지정할 수 없습니다',
        );
      await this.validateMainChar(userId, dto.gameId, dto.mainCharId);
    }

    if (dto.serverId) await this.validateServer(dto.gameId, dto.serverId);

    return this.prisma.character.create({
      data: {
        userId,
        gameId: dto.gameId,
        serverId: dto.serverId,
        serverName: dto.serverName,
        nickname: dto.nickname,
        role: dto.role,
        isMain,
        mainCharId: isMain ? null : (dto.mainCharId ?? null),
        specText: dto.specText,
        specIsPublic: dto.specIsPublic ?? true,
      },
      select: CHAR_SELECT,
    });
  }

  async update(userId: string, id: string, dto: UpdateCharacterDto) {
    const char = await this.assertOwner(userId, id);

    let updateData = dto;
    if (dto.isMain === true && char.mainCharId) {
      // 본캐로 변경 시 기존 본캐 연결 해제
      updateData = { ...dto, mainCharId: null };
    }

    if (updateData.mainCharId && updateData.isMain !== false && char.isMain) {
      throw new BadRequestException(
        'WR-CHAR-001',
        '본캐에는 mainCharId를 지정할 수 없습니다',
      );
    }

    if (updateData.mainCharId) {
      await this.validateMainChar(userId, char.gameId, updateData.mainCharId);
    }

    if (updateData.serverId) {
      await this.validateServer(char.gameId, updateData.serverId);
    }

    return this.prisma.character.update({
      where: { id },
      data: updateData,
      select: CHAR_SELECT,
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);

    // 본캐 삭제 시 연결된 부캐의 mainCharId null 처리
    await this.prisma.character.updateMany({
      where: { mainCharId: id },
      data: { mainCharId: null },
    });

    return this.prisma.character.update({
      where: { id },
      data: { isDeleted: true },
      select: { id: true },
    });
  }

  async updateAvatar(userId: string, id: string, avatarUrl: string) {
    await this.assertOwner(userId, id);
    return this.prisma.character.update({
      where: { id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }

  async updateSpecImage(userId: string, id: string, specImageUrl: string) {
    await this.assertOwner(userId, id);
    return this.prisma.character.update({
      where: { id },
      data: { specImageUrl },
      select: { id: true, specImageUrl: true },
    });
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private async assertOwner(userId: string, id: string) {
    const char = await this.prisma.character.findUnique({ where: { id } });
    if (!char || char.isDeleted)
      throw new NotFoundException('WR-CHAR-002', '캐릭터를 찾을 수 없습니다');
    if (char.userId !== userId)
      throw new ForbiddenException(
        'WR-CHAR-003',
        '본인 캐릭터만 수정할 수 있습니다',
      );
    return char;
  }

  private async validateMainChar(
    userId: string,
    gameId: string,
    mainCharId: string,
  ) {
    const main = await this.prisma.character.findUnique({
      where: { id: mainCharId },
    });
    if (!main || main.isDeleted)
      throw new NotFoundException('WR-CHAR-002', '본캐를 찾을 수 없습니다');
    if (main.userId !== userId)
      throw new ForbiddenException(
        'WR-CHAR-004',
        '본인 캐릭터만 본캐로 연결할 수 있습니다',
      );
    if (main.gameId !== gameId)
      throw new BadRequestException(
        'WR-CHAR-005',
        '본캐와 동일한 게임이어야 합니다',
      );
    if (!main.isMain)
      throw new BadRequestException(
        'WR-CHAR-006',
        '부캐를 본캐로 연결할 수 없습니다',
      );
  }

  private async validateServer(gameId: string, serverId: string) {
    const server = await this.prisma.gameServer.findFirst({
      where: { id: serverId, gameId, isActive: true },
    });
    if (!server)
      throw new NotFoundException('WR-GAME-002', '서버를 찾을 수 없습니다');
  }
}
