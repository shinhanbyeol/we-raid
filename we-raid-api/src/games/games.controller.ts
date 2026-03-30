import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: '게임 목록 조회' })
  getGames() {
    return this.gamesService.getGames();
  }

  @Get(':gameId/servers')
  @ApiOperation({ summary: '게임별 서버 목록 조회' })
  getServers(@Param('gameId') gameId: string) {
    return this.gamesService.getServers(gameId);
  }

  @Get(':gameId/event-types')
  @ApiOperation({ summary: '게임별 이벤트 유형 조회' })
  getEventTypes(@Param('gameId') gameId: string) {
    return this.gamesService.getEventTypes(gameId);
  }
}
