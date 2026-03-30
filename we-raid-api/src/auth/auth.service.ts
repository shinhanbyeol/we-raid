import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { SyncAuthDto } from './dto/sync-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async sync(dto: SyncAuthDto) {
    let user = await this.prisma.user.findUnique({
      where: { kakaoId: dto.kakaoId },
    });

    if (!user) {
      const nickname = await this.resolveNickname(dto.nickname);
      user = await this.prisma.user.create({
        data: {
          kakaoId: dto.kakaoId,
          nickname,
          profileImage: dto.profileImage ?? null,
        },
      });
    }

    const accessToken = this.jwt.sign({ sub: user.id, kakaoId: user.kakaoId });

    return { user, accessToken };
  }

  private async resolveNickname(base: string): Promise<string> {
    const exists = await this.prisma.user.findUnique({
      where: { nickname: base },
    });
    if (!exists) return base;
    return `${base}_${Date.now()}`;
  }
}
