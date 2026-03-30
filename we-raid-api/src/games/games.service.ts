import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  getGames() {
    return this.prisma.game.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailUrl: true,
        config: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getServers(gameId: string) {
    await this.assertGame(gameId);
    return this.prisma.gameServer.findMany({
      where: { gameId, isActive: true },
      select: { id: true, name: true, region: true, displayOrder: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getEventTypes(gameId: string) {
    await this.assertGame(gameId);
    return this.prisma.eventType.findMany({
      where: { OR: [{ gameId }, { gameId: null, isDefault: true }] },
      select: { id: true, name: true, description: true, isDefault: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  private async assertGame(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game || !game.isActive)
      throw new NotFoundException('WR-GAME-001', '게임을 찾을 수 없습니다');
  }
}
