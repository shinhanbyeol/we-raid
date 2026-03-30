import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';
import { CreateServerDto, UpdateServerDto } from './dto/server.dto';
import { CreateEventTypeDto } from './dto/event-type.dto';
import { UpdateUserStatusDto } from './dto/user-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Games ──────────────────────────────────────────────

  async createGame(dto: CreateGameDto) {
    const exists = await this.prisma.game.findUnique({
      where: { slug: dto.slug },
    });
    if (exists)
      throw new ConflictException('WR-ADMIN-010', '이미 존재하는 슬러그입니다');
    return this.prisma.game.create({
      data: { ...dto, config: dto.config ?? '{}' },
    });
  }

  async updateGame(id: string, dto: UpdateGameDto) {
    await this.assertGame(id);
    if (dto.slug) {
      const exists = await this.prisma.game.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (exists)
        throw new ConflictException(
          'WR-ADMIN-010',
          '이미 존재하는 슬러그입니다',
        );
    }
    return this.prisma.game.update({ where: { id }, data: dto });
  }

  async deleteGame(id: string) {
    await this.assertGame(id);
    return this.prisma.game.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Servers ────────────────────────────────────────────

  async createServer(gameId: string, dto: CreateServerDto) {
    await this.assertGame(gameId);
    return this.prisma.gameServer.create({
      data: { gameId, ...dto, displayOrder: dto.displayOrder ?? 0 },
    });
  }

  async updateServer(gameId: string, id: string, dto: UpdateServerDto) {
    await this.assertServer(gameId, id);
    return this.prisma.gameServer.update({ where: { id }, data: dto });
  }

  async deleteServer(gameId: string, id: string) {
    await this.assertServer(gameId, id);
    return this.prisma.gameServer.delete({ where: { id } });
  }

  // ── Event Types ────────────────────────────────────────

  async createEventType(gameId: string, dto: CreateEventTypeDto) {
    await this.assertGame(gameId);
    return this.prisma.eventType.create({ data: { gameId, ...dto } });
  }

  // ── Users ──────────────────────────────────────────────

  getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        profileImage: true,
        status: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException('WR-USER-003', '사용자를 찾을 수 없습니다');
    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ── helpers ────────────────────────────────────────────

  private async assertGame(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game)
      throw new NotFoundException('WR-GAME-001', '게임을 찾을 수 없습니다');
  }

  private async assertServer(gameId: string, id: string) {
    const server = await this.prisma.gameServer.findFirst({
      where: { id, gameId },
    });
    if (!server)
      throw new NotFoundException('WR-GAME-002', '서버를 찾을 수 없습니다');
  }
}
