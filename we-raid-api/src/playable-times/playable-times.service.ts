import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import { CacheService } from '../common/cache/cache.service'
import { BulkCreatePlayableTimeDto } from './dto/bulk-create-playable-time.dto'
import { UpdatePlayableTimeDto } from './dto/update-playable-time.dto'
import { CreatePlayableTimeDto } from './dto/create-playable-time.dto'

const PT_TTL = 300 // 5분
const cacheKey = (userId: string) => `pt:${userId}`

const PT_INCLUDE = {
  character: { select: { id: true, nickname: true, avatarUrl: true, role: true } },
}

@Injectable()
export class PlayableTimesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getMyPlayableTimes(userId: string) {
    const cached = this.cache.get(cacheKey(userId))
    if (cached) return JSON.parse(cached)

    const data = await this.prisma.playableTime.findMany({
      where: { userId },
      include: PT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
    this.cache.set(cacheKey(userId), JSON.stringify(data), PT_TTL)
    return data
  }

  async bulkCreate(userId: string, dto: BulkCreatePlayableTimeDto) {
    await this.validateItems(userId, dto.items)

    const created = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.playableTime.create({
          data: {
            userId,
            characterId: item.characterId ?? null,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            timezone: item.timezone ?? 'Asia/Seoul',
            isRecurring: item.isRecurring ?? true,
          },
          include: PT_INCLUDE,
        }),
      ),
    )

    this.cache.del(cacheKey(userId))
    return created
  }

  async update(userId: string, id: string, dto: UpdatePlayableTimeDto) {
    const pt = await this.assertOwner(userId, id)

    const nextStart = dto.startTime ?? pt.startTime
    const nextEnd = dto.endTime ?? pt.endTime
    this.assertTimeOrder(nextStart, nextEnd)

    const updated = await this.prisma.playableTime.update({
      where: { id },
      data: dto,
      include: PT_INCLUDE,
    })
    this.cache.del(cacheKey(userId))
    return updated
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id)
    await this.prisma.playableTime.delete({ where: { id } })
    this.cache.del(cacheKey(userId))
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private async validateItems(userId: string, items: CreatePlayableTimeDto[]) {
    for (const item of items) {
      this.assertTimeOrder(item.startTime, item.endTime)

      if (item.characterId) {
        const char = await this.prisma.character.findUnique({ where: { id: item.characterId } })
        if (!char || char.isDeleted) throw new NotFoundException('WR-CHAR-002', '캐릭터를 찾을 수 없습니다')
        if (char.userId !== userId) throw new ForbiddenException('WR-PT-001', '본인 캐릭터만 연결할 수 있습니다')
      }
    }
  }

  private async assertOwner(userId: string, id: string) {
    const pt = await this.prisma.playableTime.findUnique({ where: { id } })
    if (!pt) throw new NotFoundException('WR-PT-002', 'PT를 찾을 수 없습니다')
    if (pt.userId !== userId) throw new ForbiddenException('WR-PT-003', '본인 PT만 수정할 수 있습니다')
    return pt
  }

  private assertTimeOrder(start: string, end: string) {
    if (start >= end) {
      throw new BadRequestException('WR-PT-004', '종료 시간이 시작 시간보다 늦어야 합니다')
    }
  }
}
