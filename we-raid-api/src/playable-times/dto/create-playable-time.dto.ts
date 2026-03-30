import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreatePlayableTimeDto {
  @ApiPropertyOptional({ description: '캐릭터 ID (미입력 시 계정 전체 PT)' })
  @IsOptional()
  @IsString()
  characterId?: string;

  @ApiProperty({
    description: '요일 (0=일, 1=월 … 6=토)',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: '시작 시간 (HH:mm)', example: '20:00' })
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'startTime 형식이 올바르지 않습니다 (HH:mm)',
  })
  startTime: string;

  @ApiProperty({ description: '종료 시간 (HH:mm)', example: '23:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime 형식이 올바르지 않습니다 (HH:mm)' })
  endTime: string;

  @ApiPropertyOptional({ default: 'Asia/Seoul' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ default: true, description: '매주 반복 여부' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
