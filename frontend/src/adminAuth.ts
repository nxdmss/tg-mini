import { getTelegramInitData } from "./telegram";

export function getTelegramAdminHeaders() {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error("TELEGRAM_ADMIN_AUTH_REQUIRED");
  }

  return {
    "x-telegram-init-data": initData,
  };
}
