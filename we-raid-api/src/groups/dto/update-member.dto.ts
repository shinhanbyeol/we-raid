import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum GroupMemberRoleEnum {
  SUB_LEADER = 'SUB_LEADER',
  MEMBER = 'MEMBER',
}

export class UpdateMemberDto {
  @ApiPropertyOptional({
    enum: GroupMemberRoleEnum,
    description: '변경할 역할 (SUB_LEADER | MEMBER)',
  })
  @IsOptional()
  @IsEnum(GroupMemberRoleEnum)
  role?: GroupMemberRoleEnum;
}
