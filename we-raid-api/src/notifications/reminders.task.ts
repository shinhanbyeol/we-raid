import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

interface ReminderWindow {
  label: string;
  minBefore: number; // 기준 시간 (분)
  margin: number; // ±마진 (분)
}

const WINDOWS: ReminderWindow[] = [
  { label: 'D-1', minBefore: 24 * 60, margin: 15 },
  { label: '1시간 전', minBefore: 60, margin: 15 },
];

@Injectable()
export class RemindersTask {
  private readonly logger = new Logger(RemindersTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** 15분마다 실행 — D-1 및 1시간 전 리마인더 발송 */
  @Cron('*/15 * * * *')
  async sendReminders() {
    const now = new Date();
    await Promise.all(WINDOWS.map((win) => this.processWindow(now, win)));
  }

  private async processWindow(now: Date, win: ReminderWindow) {
    const marginMs = win.margin * 60 * 1000;
    const centerMs = win.minBefore * 60 * 1000;

    const startAtGte = new Date(now.getTime() + centerMs - marginMs);
    const startAtLte = new Date(now.getTime() + centerMs + marginMs);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        status: { in: ['OPEN', 'FULL'] },
        startAt: { gte: startAtGte, lte: startAtLte },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        participants: {
          where: { status: 'ACCEPTED' },
          select: { userId: true },
        },
      },
    });

    await Promise.all(
      schedules.map(async (schedule) => {
        const userIds = schedule.participants.map((p) => p.userId);
        if (!userIds.length) return;

        // 이미 발송한 유저 제외 (중복 방지)
        const alreadySent = await this.prisma.notification.findMany({
          where: {
            type: 'SCHEDULE_REMINDER',
            userId: { in: userIds },
            payload: { contains: schedule.id },
          },
          select: { userId: true },
        });
        const sentUserIds = new Set(alreadySent.map((n) => n.userId));
        const targetUserIds = userIds.filter((id) => !sentUserIds.has(id));

        if (!targetUserIds.length) return;

        await this.notificationsService.notifyMany(targetUserIds, {
          type: 'SCHEDULE_REMINDER',
          title: `레이드 리마인더 (${win.label})`,
          body: `"${schedule.title}" 일정이 ${win.label}에 시작됩니다.`,
          payload: { scheduleId: schedule.id, window: win.label },
        });

        this.logger.log(
          `[${win.label}] "${schedule.title}" → ${targetUserIds.length}명 알림 발송`,
        );
      }),
    );
  }
}
