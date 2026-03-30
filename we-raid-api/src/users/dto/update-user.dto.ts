import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: '닉네임 (2~20자)' })
  @IsString()
  @Length(2, 20)
  nickname: string;
}
