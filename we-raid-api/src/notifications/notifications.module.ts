import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SseService } from './sse.service';
import { RemindersTask } from './reminders.task';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, SseService, RemindersTask],
  exports: [NotificationsService],
})
export class NotificationsModule {}
