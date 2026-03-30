import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ParticipantResponseStatus {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export class RespondParticipantDto {
  @ApiProperty({
    enum: ParticipantResponseStatus,
    description: '수락(ACCEPTED) 또는 거절(DECLINED)',
  })
  @IsEnum(ParticipantResponseStatus)
  status: ParticipantResponseStatus;
}
