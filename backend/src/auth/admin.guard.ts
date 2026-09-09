import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context.switchToHttp().getRequest();

    const telegramId =
      String(
        request.user?.telegramId ??
          '',
      ).trim();

    /*
     * Support both env names:
     *
     * OLD:
     * ADMIN_TELEGRAM_ID=123456789
     *
     * NEW:
     * ADMIN_TELEGRAM_IDS=123456789,987654321
     *
     * Fail CLOSED if neither is configured.
     */
    const rawIds = [
      process.env
        .ADMIN_TELEGRAM_ID,
      process.env
        .ADMIN_TELEGRAM_IDS,
    ]
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      )
      .join(',');

    const allowedIds =
      new Set(
        rawIds
          .split(',')
          .map((id) =>
            id.trim(),
          )
          .filter(Boolean),
      );

    if (
      !telegramId ||
      allowedIds.size === 0 ||
      !allowedIds.has(
        telegramId,
      )
    ) {
      throw new ForbiddenException(
        'Admin access denied',
      );
    }

    return true;
  }
}
