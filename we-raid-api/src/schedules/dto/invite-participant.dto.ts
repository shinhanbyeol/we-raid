import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class InviteParticipantDto {
  @ApiProperty({ description: '초대할 유저 ID' })
  @IsString()
  userId: string

  @ApiPropertyOptional({ description: '참여 캐릭터 ID' })
  @IsOptional()
  @IsString()
  characterId?: string

  @ApiPropertyOptional({ description: '포지션 슬롯 ID' })
  @IsOptional()
  @IsString()
  slotId?: string
}
