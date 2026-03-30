import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';
import { CreateServerDto, UpdateServerDto } from './dto/server.dto';
import { CreateEventTypeDto } from './dto/event-type.dto';
import { UpdateUserStatusDto } from './dto/user-status.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Games ──────────────────────────────────────────────

  @Post('games')
  @ApiOperation({ summary: '게임 등록' })
  createGame(@Body() dto: CreateGameDto) {
    return this.adminService.createGame(dto);
  }

  @Put('games/:id')
  @ApiOperation({ summary: '게임 수정' })
  updateGame(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.adminService.updateGame(id, dto);
  }

  @Delete('games/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '게임 비활성화' })
  deleteGame(@Param('id') id: string) {
    return this.adminService.deleteGame(id);
  }

  // ── Servers ────────────────────────────────────────────

  @Post('games/:gameId/servers')
  @ApiOperation({ summary: '서버 등록' })
  createServer(@Param('gameId') gameId: string, @Body() dto: CreateServerDto) {
    return this.adminService.createServer(gameId, dto);
  }

  @Put('games/:gameId/servers/:id')
  @ApiOperation({ summary: '서버 수정' })
  updateServer(
    @Param('gameId') gameId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServerDto,
  ) {
    return this.adminService.updateServer(gameId, id, dto);
  }

  @Delete('games/:gameId/servers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '서버 삭제' })
  deleteServer(@Param('gameId') gameId: string, @Param('id') id: string) {
    return this.adminService.deleteServer(gameId, id);
  }

  // ── Event Types ────────────────────────────────────────

  @Post('games/:gameId/event-types')
  @ApiOperation({ summary: '이벤트 유형 등록' })
  createEventType(
    @Param('gameId') gameId: string,
    @Body() dto: CreateEventTypeDto,
  ) {
    return this.adminService.createEventType(gameId, dto);
  }

  // ── Users ──────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: '유저 목록 조회' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '유저 상태 변경 (BANNED/ACTIVE)' })
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }
}
