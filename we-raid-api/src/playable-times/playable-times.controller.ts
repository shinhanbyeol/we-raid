import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PlayableTimesService } from './playable-times.service'
import { BulkCreatePlayableTimeDto } from './dto/bulk-create-playable-time.dto'
import { UpdatePlayableTimeDto } from './dto/update-playable-time.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

interface AuthUser { id: string }

@ApiTags('playable-times')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playable-times')
export class PlayableTimesController {
  constructor(private readonly playableTimesService: PlayableTimesService) {}

  @Get()
  @ApiOperation({ summary: '내 PT 목록 조회 (인메모리 캐시 5분)' })
  getMyPlayableTimes(@CurrentUser() user: AuthUser) {
    return this.playableTimesService.getMyPlayableTimes(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'PT 일괄 등록 (최대 50개, 트랜잭션)' })
  bulkCreate(@CurrentUser() user: AuthUser, @Body() dto: BulkCreatePlayableTimeDto) {
    return this.playableTimesService.bulkCreate(user.id, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'PT 수정' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePlayableTimeDto) {
    return this.playableTimesService.update(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'PT 삭제' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.playableTimesService.remove(user.id, id)
  }
}
