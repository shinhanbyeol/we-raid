import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'URL 슬러그 (영소문자, 하이픈)' })
  @IsString()
  @MaxLength(30)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ default: '{}' })
  @IsOptional()
  @IsString()
  config?: string;
}

export class UpdateGameDto extends PartialType(CreateGameDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
