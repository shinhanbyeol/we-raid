import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FriendshipsService } from './friendships.service';
import { CreateFriendshipDto } from './dto/create-friendship.dto';
import { QueryFriendshipDto } from './dto/query-friendship.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
}

@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Get()
  @ApiOperation({
    summary: '친구 목록 조회 (status 필터: PENDING | ACCEPTED | BLOCKED)',
  })
  getFriendships(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryFriendshipDto,
  ) {
    return this.friendshipsService.getFriendships(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: '친구 신청' })
  sendRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateFriendshipDto) {
    return this.friendshipsService.sendRequest(user.id, dto);
  }

  @Patch(':requesterId/accept')
  @ApiOperation({ summary: '친구 요청 수락 (나에게 신청한 requesterId)' })
  acceptRequest(
    @CurrentUser() user: AuthUser,
    @Param('requesterId') requesterId: string,
  ) {
    return this.friendshipsService.acceptRequest(user.id, requesterId);
  }

  @Patch(':userId/block')
  @ApiOperation({ summary: '유저 차단' })
  blockUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ) {
    return this.friendshipsService.blockUser(user.id, targetUserId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '친구 삭제 / 요청 거절' })
  removeFriendship(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ) {
    return this.friendshipsService.removeFriendship(user.id, targetUserId);
  }
}
