import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SyncAuthDto } from './dto/sync-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'NextAuth 콜백 후 사용자 동기화 및 백엔드 토큰 발급',
  })
  sync(@Body() dto: SyncAuthDto) {
    return this.authService.sync(dto);
  }
}
