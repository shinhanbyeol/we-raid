import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, MaxLength, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Region } from '@prisma/client'

export class CreateServerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  name: string

  @ApiPropertyOptional({ enum: Region, default: Region.KR })
  @IsOptional()
  @IsEnum(Region)
  region?: Region

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number
}

export class UpdateServerDto extends PartialType(CreateServerDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
