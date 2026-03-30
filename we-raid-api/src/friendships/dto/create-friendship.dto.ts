import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFriendshipDto {
  @ApiProperty({ description: '친구 신청 대상 유저 ID' })
  @IsString()
  addresseeId: string;
}
