import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncAuthDto {
  @ApiProperty()
  @IsString()
  kakaoId: string;

  @ApiProperty()
  @IsString()
  nickname: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
