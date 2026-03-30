import { Module } from '@nestjs/common';
import { PlayableTimesController } from './playable-times.controller';
import { PlayableTimesService } from './playable-times.service';

@Module({
  controllers: [PlayableTimesController],
  providers: [PlayableTimesService],
})
export class PlayableTimesModule {}
