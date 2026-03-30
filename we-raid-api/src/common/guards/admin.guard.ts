import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { isAdmin?: boolean } }>();
    if (!user?.isAdmin)
      throw new ForbiddenException('WR-ADMIN-001', '관리자 권한이 필요합니다');
    return true;
  }
}
