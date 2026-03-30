import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CharacterRole } from '@prisma/client';

export class CreateCharacterDto {
  @ApiProperty()
  @IsString()
  gameId: string;

  @ApiPropertyOptional({ description: '서버 ID (GameServer 테이블)' })
  @IsOptional()
  @IsString()
  serverId?: string;

  @ApiProperty({
    description: '서버명 (직접 입력 또는 서버 선택 시 자동 채워짐)',
  })
  @IsString()
  @MaxLength(50)
  serverName: string;

  @ApiProperty({ description: '게임 내 캐릭터 닉네임 (최대 30자)' })
  @IsString()
  @MaxLength(30)
  nickname: string;

  @ApiProperty({ enum: CharacterRole })
  @IsEnum(CharacterRole)
  role: CharacterRole;

  @ApiPropertyOptional({
    default: true,
    description: 'true: 본캐, false: 부캐',
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiPropertyOptional({ description: '부캐인 경우 연결할 본캐 ID' })
  @IsOptional()
  @IsString()
  mainCharId?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specText?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  specIsPublic?: boolean;
}
