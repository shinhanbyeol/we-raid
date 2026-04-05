import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateGroupDto {
  @ApiPropertyOptional({ description: '그룹 이름 (2~30자)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name?: string;

  @ApiPropertyOptional({ description: '그룹 설명 (최대 200자)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: '공개 여부' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
