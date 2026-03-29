import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateGroupDto {
  @ApiProperty({ description: '그룹 이름 (2~30자)' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string

  @ApiProperty({ description: '게임 ID' })
  @IsString()
  gameId: string

  @ApiPropertyOptional({ description: '그룹 설명 (최대 200자)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string

  @ApiPropertyOptional({ description: '공개 여부 (기본값: false)' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean
}
