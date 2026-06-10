import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private auth: TelegramAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = await this.auth.getRequestUser(request);
    return true;
  }
}
