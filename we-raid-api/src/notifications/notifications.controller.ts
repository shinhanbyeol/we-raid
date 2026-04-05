import {
  Controller,
  Get,
  Patch,
  Param,
  Res,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import type { Response } from 'express';
import { NotificationsService } from './notifications.service';
import { SseService } from './sse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
  ) {}

  @Get()
  @ApiOperation({ summary: '인앱 알림 목록 (최신 50개 + 미읽음 카운트)' })
  getNotifications(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getNotifications(user.id);
  }

  @Get('stream')
  @Sse()
  @ApiOperation({ summary: 'SSE 실시간 알림 스트림 — EventSource로 연결 유지' })
  stream(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    res.on('close', () => this.sseService.disconnect(user.id));
    return this.sseService.subscribe(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markAsRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
