import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsOptional } from 'class-validator'

export enum ScheduleStatusQuery {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  FULL = 'FULL',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export class QueryScheduleDto {
  @ApiPropertyOptional({ description: '조회 시작일 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  from?: string

  @ApiPropertyOptional({ description: '조회 종료일 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  to?: string

  @ApiPropertyOptional({ enum: ScheduleStatusQuery, description: '일정 상태 필터' })
  @IsOptional()
  @IsEnum(ScheduleStatusQuery)
  status?: ScheduleStatusQuery
}
