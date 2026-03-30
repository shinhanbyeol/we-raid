import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum FriendshipStatusQuery {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
}

export class QueryFriendshipDto {
  @ApiPropertyOptional({
    enum: FriendshipStatusQuery,
    description: '상태 필터 (기본: ACCEPTED)',
  })
  @IsOptional()
  @IsEnum(FriendshipStatusQuery)
  status?: FriendshipStatusQuery;
}
