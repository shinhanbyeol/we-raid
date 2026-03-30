import { Injectable, HttpStatus } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { SseService } from './sse.service';

export interface NotifyPayload {
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
  ) {}

  // ─── 인앱 알림 목록 ───────────────────────────────────────────────────────────

  async getNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  // ─── 읽음 처리 ────────────────────────────────────────────────────────────────

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new AppException(
        'WR-NOTIF-001',
        '알림을 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }
    if (notification.userId !== userId) {
      throw new AppException(
        'WR-NOTIF-002',
        '본인 알림만 읽음 처리할 수 있습니다',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // ─── 알림 생성 + SSE 실시간 전송 ──────────────────────────────────────────────

  async notify(userId: string, data: NotifyPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        payload: JSON.stringify(data.payload ?? {}),
      },
    });

    this.sse.push(userId, { type: 'notification', data: notification });

    return notification;
  }

  async notifyMany(userIds: string[], data: NotifyPayload) {
    if (!userIds.length) return;

    const payload = JSON.stringify(data.payload ?? {});
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        payload,
      })),
    });

    // createMany는 개별 ID를 반환하지 않으므로, SSE 전송을 위해 생성된 항목 조회
    const recent = await this.prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        type: data.type,
        body: data.body,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: userIds.length,
    });

    for (const notif of recent) {
      this.sse.push(notif.userId, { type: 'notification', data: notif });
    }
  }
}
