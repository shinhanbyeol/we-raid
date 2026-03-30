import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @ApiProperty({ description: '일정 제목 (최대 60자)' })
  @IsString()
  @MaxLength(60)
  title: string;

  @ApiProperty({ description: '게임 ID' })
  @IsString()
  gameId: string;

  @ApiPropertyOptional({ description: '그룹 ID' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({ description: '이벤트 유형 ID' })
  @IsOptional()
  @IsString()
  eventTypeId?: string;

  @ApiProperty({ description: '시작 시간 (ISO 8601)' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ description: '종료 시간 (ISO 8601)' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ description: '최대 참여 인원', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxParticipants: number;

  @ApiPropertyOptional({ description: '일정 설명 (최대 500자)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: '공대장 호칭 (기본: 공대장)',
    default: '공대장',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  leaderTitle?: string;

  @ApiPropertyOptional({
    description: 'RRULE 반복 규칙 (예: FREQ=WEEKLY;BYDAY=SA,SU)',
  })
  @IsOptional()
  @IsString()
  recurringRule?: string;
}
