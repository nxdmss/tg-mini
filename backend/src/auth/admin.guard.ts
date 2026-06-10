import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: TelegramAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user; // 👈 ВАЖНО (не telegramUser)

    if (!this.auth.isAdmin(user)) {
      throw new ForbiddenException('Admin role is required');
    }

    return true;
  }
}