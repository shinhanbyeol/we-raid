import { Injectable, HttpStatus } from '@nestjs/common';
import { RRule } from 'rrule';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { QueryPublicScheduleDto } from './dto/query-public-schedule.dto';
import { CreateSlotsDto } from './dto/create-slot.dto';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import { RespondParticipantDto } from './dto/respond-participant.dto';

const PARTICIPANT_SELECT = {
  id: true,
  status: true,
  respondedAt: true,
  createdAt: true,
  user: { select: { id: true, nickname: true, profileImage: true } },
  character: {
    select: { id: true, nickname: true, avatarUrl: true, role: true },
  },
  slot: { select: { id: true, role: true, count: true } },
};

const SCHEDULE_BASE_SELECT = {
  id: true,
  title: true,
  leaderTitle: true,
  startAt: true,
  endAt: true,
  maxParticipants: true,
  status: true,
  description: true,
  recurringRule: true,
  createdAt: true,
  updatedAt: true,
  leader: { select: { id: true, nickname: true, profileImage: true } },
  game: { select: { id: true, name: true, slug: true } },
  group: { select: { id: true, name: true } },
  eventType: { select: { id: true, name: true } },
  _count: {
    select: { participants: { where: { status: 'ACCEPTED' as const } } },
  },
};

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── 내 일정 목록 ────────────────────────────────────────────────────────────

  async getMySchedules(userId: string, query: QueryScheduleDto) {
    const where: Record<string, any> = {
      participants: {
        some: { userId, status: { in: ['ACCEPTED', 'PENDING', 'WAITLIST'] } },
      },
    };

    where.status = query.status ?? { not: 'CANCELLED' };

    if (query.from || query.to) {
      where.startAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    return this.prisma.schedule.findMany({
      where,
      select: SCHEDULE_BASE_SELECT,
      orderBy: { startAt: 'asc' },
    });
  }

  // ─── 일정 생성 ───────────────────────────────────────────────────────────────

  async createSchedule(userId: string, dto: CreateScheduleDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new AppException(
        'WR-SCHED-001',
        '종료 시간이 시작 시간보다 늦어야 합니다',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.recurringRule) this.validateRRule(dto.recurringRule);

    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId, isActive: true },
    });
    if (!game)
      throw new AppException(
        'WR-SCHED-002',
        '게임을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );

    if (dto.groupId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: dto.groupId, userId } },
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new AppException(
          'WR-SCHED-003',
          '그룹 멤버만 그룹 일정을 생성할 수 있습니다',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.create({
        data: {
          title: dto.title,
          leaderId: userId,
          leaderTitle: dto.leaderTitle ?? '공대장',
          gameId: dto.gameId,
          groupId: dto.groupId,
          eventTypeId: dto.eventTypeId,
          startAt,
          endAt,
          maxParticipants: dto.maxParticipants,
          description: dto.description,
          recurringRule: dto.recurringRule,
          status: 'OPEN',
        },
        select: SCHEDULE_BASE_SELECT,
      });

      // 리더를 ACCEPTED 참여자로 자동 추가
      await tx.participant.create({
        data: {
          scheduleId: schedule.id,
          userId,
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      return schedule;
    });
  }

  // ─── 일정 상세 ───────────────────────────────────────────────────────────────

  async getSchedule(userId: string, scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: {
        ...SCHEDULE_BASE_SELECT,
        participants: {
          select: PARTICIPANT_SELECT,
          orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!schedule)
      throw new AppException(
        'WR-SCHED-004',
        '일정을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );

    // 그룹 일정은 그룹 멤버만 조회 가능
    if (schedule.group) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: schedule.group.id, userId } },
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new AppException(
          'WR-SCHED-005',
          '그룹 멤버만 조회할 수 있습니다',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // recurringRule이 있으면 다음 10회 발생 일자 파싱하여 포함
    const recurringOccurrences = this.parseNextOccurrences(
      schedule.recurringRule,
      schedule.startAt,
    );

    return { ...schedule, recurringOccurrences };
  }

  // ─── 일정 수정 ───────────────────────────────────────────────────────────────

  async updateSchedule(
    userId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ) {
    const schedule = await this.assertLeader(userId, scheduleId);
    this.assertNotCancelled(schedule);

    const startAt = dto.startAt ? new Date(dto.startAt) : schedule.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : schedule.endAt;
    if (startAt >= endAt) {
      throw new AppException(
        'WR-SCHED-001',
        '종료 시간이 시작 시간보다 늦어야 합니다',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.recurringRule) this.validateRRule(dto.recurringRule);

    const timeChanged = dto.startAt !== undefined || dto.endAt !== undefined;

    const updated = await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...dto,
        ...(dto.startAt ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.endAt ? { endAt: new Date(dto.endAt) } : {}),
      },
      select: SCHEDULE_BASE_SELECT,
    });

    // 시간이 변경되면 ACCEPTED 참여자들에게 알림 발송 (리더 제외)
    if (timeChanged) {
      const participants = await this.prisma.participant.findMany({
        where: { scheduleId, status: 'ACCEPTED', userId: { not: userId } },
        select: { userId: true },
      });
      await this.notifications.notifyMany(
        participants.map((p) => p.userId),
        {
          type: 'SCHEDULE_CHANGED',
          title: '레이드 일정 시간이 변경되었습니다',
          body: `"${updated.title}" 일정의 시간이 변경되었습니다. 확인해 주세요.`,
          payload: { scheduleId },
        },
      );
    }

    return updated;
  }

  // ─── 일정 취소 ───────────────────────────────────────────────────────────────

  async cancelSchedule(userId: string, scheduleId: string) {
    const schedule = await this.assertLeader(userId, scheduleId);
    this.assertNotCancelled(schedule);

    const updated = await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'CANCELLED' },
      select: SCHEDULE_BASE_SELECT,
    });

    // ACCEPTED / PENDING 참여자 모두에게 알림 (리더 제외)
    const participants = await this.prisma.participant.findMany({
      where: {
        scheduleId,
        status: { in: ['ACCEPTED', 'PENDING'] },
        userId: { not: userId },
      },
      select: { userId: true },
    });
    await this.notifications.notifyMany(
      participants.map((p) => p.userId),
      {
        type: 'SCHEDULE_CANCELLED',
        title: '레이드 일정이 취소되었습니다',
        body: `"${schedule.title}" 일정이 취소되었습니다.`,
        payload: { scheduleId },
      },
    );

    return updated;
  }

  // ─── 참여자 초대 ─────────────────────────────────────────────────────────────

  async inviteParticipant(
    userId: string,
    scheduleId: string,
    dto: InviteParticipantDto,
  ) {
    const schedule = await this.assertLeader(userId, scheduleId);
    this.assertNotCancelled(schedule);
    if (schedule.status === 'CLOSED') {
      throw new AppException(
        'WR-SCHED-006',
        '마감된 일정에는 초대할 수 없습니다',
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!targetUser || targetUser.status !== 'ACTIVE') {
      throw new AppException(
        'WR-SCHED-007',
        '유저를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.participant.findUnique({
      where: { scheduleId_userId: { scheduleId, userId: dto.userId } },
    });
    if (existing)
      throw new AppException(
        'WR-SCHED-008',
        '이미 초대된 유저입니다',
        HttpStatus.CONFLICT,
      );

    const participant = await this.prisma.participant.create({
      data: {
        scheduleId,
        userId: dto.userId,
        characterId: dto.characterId,
        slotId: dto.slotId,
        status: 'PENDING',
        invitedById: userId,
      },
      select: PARTICIPANT_SELECT,
    });

    await this.notifications.notify(dto.userId, {
      type: 'RAID_INVITE',
      title: '레이드 초대',
      body: `"${schedule.title}" 레이드에 초대되었습니다. 수락/거절해 주세요.`,
      payload: { scheduleId },
    });

    return participant;
  }

  // ─── 참여 수락/거절 ──────────────────────────────────────────────────────────

  async respondParticipant(
    userId: string,
    scheduleId: string,
    dto: RespondParticipantDto,
  ) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule)
      throw new AppException(
        'WR-SCHED-004',
        '일정을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    this.assertNotCancelled(schedule);

    const participant = await this.prisma.participant.findUnique({
      where: { scheduleId_userId: { scheduleId, userId } },
    });
    if (!participant)
      throw new AppException(
        'WR-SCHED-009',
        '초대 내역이 없습니다',
        HttpStatus.NOT_FOUND,
      );

    if (participant.status === 'ACCEPTED') {
      throw new AppException(
        'WR-SCHED-010',
        '이미 수락한 초대입니다',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (participant.status === 'DECLINED') {
      throw new AppException(
        'WR-SCHED-011',
        '이미 거절한 초대입니다',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (participant.status === 'WAITLIST') {
      throw new AppException(
        'WR-SCHED-015',
        '대기열에 있습니다. 자리가 생기면 알림을 받게 됩니다',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 수락 처리
    if (dto.status === ('ACCEPTED' as RespondParticipantDto['status'])) {
      // 시간 충돌 감지
      await this.detectConflict(
        userId,
        scheduleId,
        schedule.startAt,
        schedule.endAt,
      );

      const acceptedCount = await this.prisma.participant.count({
        where: { scheduleId, status: 'ACCEPTED' },
      });

      // 정원 초과 → WAITLIST 자동 전환
      if (acceptedCount >= schedule.maxParticipants) {
        return this.prisma.participant.update({
          where: { scheduleId_userId: { scheduleId, userId } },
          data: { status: 'WAITLIST', respondedAt: new Date() },
          select: PARTICIPANT_SELECT,
        });
      }

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.participant.update({
          where: { scheduleId_userId: { scheduleId, userId } },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
          select: PARTICIPANT_SELECT,
        });

        // 정원이 찼으면 schedule.status = FULL
        if (acceptedCount + 1 >= schedule.maxParticipants) {
          await tx.schedule.update({
            where: { id: scheduleId },
            data: { status: 'FULL' },
          });
        }

        return updated;
      });
    }

    // 거절 처리
    const updated = await this.prisma.participant.update({
      where: { scheduleId_userId: { scheduleId, userId } },
      data: { status: 'DECLINED', respondedAt: new Date() },
      select: PARTICIPANT_SELECT,
    });

    // 빈 자리 생기면 WAITLIST 첫 번째 유저를 PENDING으로 전환 + 알림
    await this.promoteWaitlist(scheduleId, schedule.title);

    // 정원이 이전에 꽉 찼었다면 OPEN으로 복원
    if (schedule.status === 'FULL') {
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: 'OPEN' },
      });
    }

    return updated;
  }

  // ─── 공개 모집 목록 ──────────────────────────────────────────────────────────

  async getPublicSchedules(query: QueryPublicScheduleDto) {
    const where: Record<string, any> = {
      groupId: null, // 그룹 미소속 = 공개 모집
      status: { in: ['OPEN', 'FULL'] },
    };

    if (query.gameId) where.gameId = query.gameId;

    if (query.role) {
      where.slots = { some: { role: query.role } };
    }

    return this.prisma.schedule.findMany({
      where,
      select: {
        ...SCHEDULE_BASE_SELECT,
        slots: {
          select: { id: true, role: true, count: true, filledCount: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  // ─── 포지션 슬롯 등록 ────────────────────────────────────────────────────────

  async setSlots(userId: string, scheduleId: string, dto: CreateSlotsDto) {
    const schedule = await this.assertLeader(userId, scheduleId);
    this.assertNotCancelled(schedule);

    return this.prisma.$transaction(async (tx) => {
      // 기존 슬롯 전체 삭제 후 재등록
      await tx.scheduleSlot.deleteMany({ where: { scheduleId } });

      if (!dto.slots.length) return [];

      await tx.scheduleSlot.createMany({
        data: dto.slots.map((s) => ({
          scheduleId,
          role: s.role,
          count: s.count,
        })),
      });

      return tx.scheduleSlot.findMany({
        where: { scheduleId },
        select: { id: true, role: true, count: true, filledCount: true },
      });
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async assertLeader(userId: string, scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule)
      throw new AppException(
        'WR-SCHED-004',
        '일정을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    if (schedule.leaderId !== userId) {
      throw new AppException(
        'WR-SCHED-012',
        '리더만 수정할 수 있습니다',
        HttpStatus.FORBIDDEN,
      );
    }
    return schedule;
  }

  private assertNotCancelled(schedule: { status: string }) {
    if (schedule.status === 'CANCELLED') {
      throw new AppException(
        'WR-SCHED-013',
        '취소된 일정입니다',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** 동일 userId의 ACCEPTED 일정과 시간 충돌 감지 */
  private async detectConflict(
    userId: string,
    excludeScheduleId: string,
    startAt: Date,
    endAt: Date,
  ) {
    const conflict = await this.prisma.participant.findFirst({
      where: {
        userId,
        status: 'ACCEPTED',
        scheduleId: { not: excludeScheduleId },
        schedule: {
          status: { not: 'CANCELLED' },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      },
      include: {
        schedule: {
          select: { id: true, title: true, startAt: true, endAt: true },
        },
      },
    });

    if (conflict) {
      throw new AppException(
        'WR-SCHED-014',
        `일정 충돌: "${conflict.schedule.title}"과 시간이 겹칩니다`,
        HttpStatus.CONFLICT,
      );
    }
  }

  /** WAITLIST 첫 번째 유저를 PENDING으로 전환하고 알림 발송 */
  private async promoteWaitlist(scheduleId: string, scheduleTitle: string) {
    const first = await this.prisma.participant.findFirst({
      where: { scheduleId, status: 'WAITLIST' },
      orderBy: { createdAt: 'asc' },
    });
    if (!first) return;

    await this.prisma.participant.update({
      where: { id: first.id },
      data: { status: 'PENDING' },
    });

    await this.notifications.notify(first.userId, {
      type: 'WAITLIST_PROMOTED',
      title: '레이드 대기열에서 초대로 전환되었습니다',
      body: `"${scheduleTitle}" 레이드에 자리가 생겼습니다. 수락/거절해 주세요.`,
      payload: { scheduleId },
    });
  }

  /** RRULE 문자열 유효성 검증 */
  private validateRRule(rule: string) {
    try {
      RRule.fromString(rule);
    } catch {
      throw new AppException(
        'WR-SCHED-016',
        '유효하지 않은 RRULE 형식입니다',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** recurringRule로부터 dtstart 기준 다음 N회 발생 일자 반환 */
  private parseNextOccurrences(
    rule: string | null,
    dtstart: Date,
    count = 10,
  ): Date[] {
    if (!rule) return [];
    try {
      const rrule = RRule.fromString(rule);
      const ruleWithStart = new RRule({ ...rrule.options, dtstart, count });
      return ruleWithStart.all();
    } catch {
      return [];
    }
  }
}
