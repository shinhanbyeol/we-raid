import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CharactersModule } from './characters/characters.module'
import { GamesModule } from './games/games.module'
import { GroupsModule } from './groups/groups.module'
import { SchedulesModule } from './schedules/schedules.module'
import { PlayableTimesModule } from './playable-times/playable-times.module'
import { NotificationsModule } from './notifications/notifications.module'
import { FriendshipsModule } from './friendships/friendships.module'
import { AdminModule } from './admin/admin.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { CacheModule } from './common/cache/cache.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    CharactersModule,
    GamesModule,
    GroupsModule,
    SchedulesModule,
    PlayableTimesModule,
    NotificationsModule,
    FriendshipsModule,
    AdminModule,
  ],
})
export class AppModule {}
