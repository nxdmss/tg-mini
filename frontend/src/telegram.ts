import WebApp from "@twa-dev/sdk";

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

let initialized = false;

export function initTelegram() {
  if (initialized) return;
  initialized = true;
  try {
    WebApp.ready();
    WebApp.expand();
  } catch {
    // Not running inside Telegram (e.g. local browser) — ignore.
  }
}

export function getTelegramUser(): TgUser | null {
  try {
    return WebApp.initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

export function getTelegramId(): string {
  const user = getTelegramUser();
  if (user?.id) return String(user.id);
  return "web-guest";
}

export function getUserName(): string | undefined {
  const user = getTelegramUser();
  if (!user) return undefined;
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
}

export const tg = WebApp;
