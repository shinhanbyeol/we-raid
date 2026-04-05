import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '닉네임 수정' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Patch('me/boarded')
  @ApiOperation({ summary: '온보딩 완료' })
  completeOnboarding(@CurrentUser() user: AuthUser) {
    return this.usersService.completeOnboarding(user.id);
  }

  @Get(':userId/characters')
  @ApiOperation({ summary: '유저 캐릭터 목록 조회 (스펙 공개 설정 적용)' })
  getUserCharacters(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetId: string,
  ) {
    return this.usersService.getUserCharacters(user.id, targetId);
  }

  @Get(':userId/playable-times')
  @ApiOperation({ summary: '유저 플레이 가능 시간 조회 (그룹원 권한 검증)' })
  getUserPlayableTimes(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetId: string,
  ) {
    return this.usersService.getUserPlayableTimes(user.id, targetId);
  }
}
