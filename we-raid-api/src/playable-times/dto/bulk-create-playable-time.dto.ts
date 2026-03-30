import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePlayableTimeDto } from './create-playable-time.dto';

export class BulkCreatePlayableTimeDto {
  @ApiProperty({
    type: [CreatePlayableTimeDto],
    description: '일괄 등록할 PT 슬롯 목록 (최대 50개)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreatePlayableTimeDto)
  items: CreatePlayableTimeDto[];
}
