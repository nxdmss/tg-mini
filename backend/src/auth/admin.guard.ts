import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private auth: TelegramAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = await this.auth.getRequestUser(request);
    request.telegramUser = user;
    if (!this.auth.isAdmin(user)) {
      throw new ForbiddenException('Admin role is required');
    }
    return true;
  }
}
