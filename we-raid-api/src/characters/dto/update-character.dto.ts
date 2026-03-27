import { IsString, IsOptional, IsBoolean, IsEnum, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { CharacterRole } from '@prisma/client'

export class UpdateCharacterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serverId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  serverName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string

  @ApiPropertyOptional({ enum: CharacterRole })
  @IsOptional()
  @IsEnum(CharacterRole)
  role?: CharacterRole

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMain?: boolean

  @ApiPropertyOptional({ description: 'null 전달 시 본캐 연결 해제' })
  @IsOptional()
  @IsString()
  mainCharId?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specText?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  specIsPublic?: boolean
}
