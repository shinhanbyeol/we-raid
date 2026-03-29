import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SchedulesService } from './schedules.service'
import { CreateScheduleDto } from './dto/create-schedule.dto'
import { UpdateScheduleDto } from './dto/update-schedule.dto'
import { QueryScheduleDto } from './dto/query-schedule.dto'
import { QueryPublicScheduleDto } from './dto/query-public-schedule.dto'
import { CreateSlotsDto } from './dto/create-slot.dto'
import { InviteParticipantDto } from './dto/invite-participant.dto'
import { RespondParticipantDto } from './dto/respond-participant.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

interface AuthUser { id: string }

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: '내 일정 목록 (from, to, status 필터)' })
  getMySchedules(@CurrentUser() user: AuthUser, @Query() query: QueryScheduleDto) {
    return this.schedulesService.getMySchedules(user.id, query)
  }

  @Get('public')
  @ApiOperation({ summary: '공개 모집 목록 (gameId, role 필터) — 그룹 미소속 OPEN/FULL 일정' })
  getPublicSchedules(@Query() query: QueryPublicScheduleDto) {
    return this.schedulesService.getPublicSchedules(query)
  }

  @Post()
  @ApiOperation({ summary: '일정 생성 (생성자 ACCEPTED 자동 부여)' })
  createSchedule(@CurrentUser() user: AuthUser, @Body() dto: CreateScheduleDto) {
    return this.schedulesService.createSchedule(user.id, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '일정 상세 조회 (참여자 목록 포함)' })
  getSchedule(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedulesService.getSchedule(user.id, id)
  }

  @Put(':id')
  @ApiOperation({ summary: '일정 수정 (리더 권한, 시간 변경 시 알림 발송)' })
  updateSchedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.updateSchedule(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '일정 취소 (리더 권한, 전체 알림 발송)' })
  cancelSchedule(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedulesService.cancelSchedule(user.id, id)
  }

  @Post(':id/slots')
  @ApiOperation({ summary: '포지션 슬롯 등록 (리더 권한, 기존 슬롯 전체 대체)' })
  setSlots(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateSlotsDto,
  ) {
    return this.schedulesService.setSlots(user.id, id, dto)
  }

  @Post(':id/participants')
  @ApiOperation({ summary: '참여자 초대 (PENDING 생성, 알림 발송)' })
  inviteParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: InviteParticipantDto,
  ) {
    return this.schedulesService.inviteParticipant(user.id, id, dto)
  }

  @Patch(':id/participants/me')
  @ApiOperation({ summary: '참여 수락/거절 (충돌 감지, 정원 초과 시 WAITLIST)' })
  respondParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondParticipantDto,
  ) {
    return this.schedulesService.respondParticipant(user.id, id, dto)
  }
}
