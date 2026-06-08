import { Role } from '@prisma/client';

export type TelegramRequestUser = {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: Role;
};
