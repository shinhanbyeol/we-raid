import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, Matches } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export class UpdatePlayableTimeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number

  @ApiPropertyOptional({ example: '20:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime 형식이 올바르지 않습니다 (HH:mm)' })
  startTime?: string

  @ApiPropertyOptional({ example: '23:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime 형식이 올바르지 않습니다 (HH:mm)' })
  endTime?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean
}
