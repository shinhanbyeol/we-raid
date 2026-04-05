import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
}

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: '내가 속한 그룹 목록' })
  getMyGroups(@CurrentUser() user: AuthUser) {
    return this.groupsService.getMyGroups(user.id);
  }

  @Post()
  @ApiOperation({ summary: '그룹 생성 (생성자 OWNER 자동 부여)' })
  createGroup(@CurrentUser() user: AuthUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(user.id, dto);
  }

  @Post('join/:inviteCode')
  @ApiOperation({ summary: '초대 코드로 그룹 가입' })
  joinByInviteCode(
    @CurrentUser() user: AuthUser,
    @Param('inviteCode') inviteCode: string,
  ) {
    return this.groupsService.joinByInviteCode(user.id, inviteCode);
  }

  @Get(':id')
  @ApiOperation({ summary: '그룹 상세 조회' })
  getGroup(@CurrentUser() user: AuthUser, @Param('id') groupId: string) {
    return this.groupsService.getGroup(user.id, groupId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '그룹 멤버 목록 조회' })
  getMembers(@CurrentUser() user: AuthUser, @Param('id') groupId: string) {
    return this.groupsService.getMembers(user.id, groupId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: '플랫폼 내 유저 검색 초대 (OWNER / SUB_LEADER)' })
  inviteMember(
    @CurrentUser() user: AuthUser,
    @Param('id') groupId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(user.id, groupId, dto);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: '멤버 역할 변경 (OWNER 전용)' })
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.groupsService.updateMember(user.id, groupId, targetUserId, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '멤버 강퇴 / 탈퇴 (OWNER·SUB_LEADER 강퇴, 본인 탈퇴 가능)',
  })
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.removeMember(user.id, groupId, targetUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '그룹 정보 수정 (OWNER 전용)' })
  updateGroup(
    @CurrentUser() user: AuthUser,
    @Param('id') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(user.id, groupId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '그룹 삭제 (OWNER 전용)' })
  deleteGroup(@CurrentUser() user: AuthUser, @Param('id') groupId: string) {
    return this.groupsService.deleteGroup(user.id, groupId);
  }
}
