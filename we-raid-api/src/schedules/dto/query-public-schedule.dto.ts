import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CharacterRoleQuery {
  TANK = 'TANK',
  HEAL = 'HEAL',
  DPS = 'DPS',
  SUPPORT = 'SUPPORT',
  ETC = 'ETC',
}

export class QueryPublicScheduleDto {
  @ApiPropertyOptional({ description: '게임 ID 필터' })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    enum: CharacterRoleQuery,
    description: '포지션 필터 (해당 역할 슬롯이 있는 일정)',
  })
  @IsOptional()
  @IsEnum(CharacterRoleQuery)
  role?: CharacterRoleQuery;
}
