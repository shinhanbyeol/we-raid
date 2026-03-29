import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxParticipants?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  leaderTitle?: string

  @ApiPropertyOptional({ description: 'RRULE 반복 규칙 (null 전달 시 반복 해제)' })
  @IsOptional()
  @IsString()
  recurringRule?: string
}
