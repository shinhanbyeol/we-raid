import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCharacterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({ description: 'true: 본캐만, false: 부캐만' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isMain?: boolean;
}
