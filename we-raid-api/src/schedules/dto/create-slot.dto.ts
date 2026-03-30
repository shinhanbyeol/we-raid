import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CharacterRoleEnum {
  TANK = 'TANK',
  HEAL = 'HEAL',
  DPS = 'DPS',
  SUPPORT = 'SUPPORT',
  ETC = 'ETC',
}

export class SlotItemDto {
  @ApiProperty({ enum: CharacterRoleEnum, description: '포지션 역할' })
  @IsEnum(CharacterRoleEnum)
  role: CharacterRoleEnum;

  @ApiProperty({ description: '정원', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  count: number;
}

export class CreateSlotsDto {
  @ApiProperty({
    type: [SlotItemDto],
    description: '슬롯 목록 (기존 슬롯을 전체 대체)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotItemDto)
  slots: SlotItemDto[];
}
