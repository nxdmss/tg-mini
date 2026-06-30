import WebApp from "@twa-dev/sdk";

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

let initialized = false;

function getRawWebApp() {
  return (window as unknown as { Telegram?: { WebApp?: typeof WebApp } }).Telegram?.WebApp;
}

function getWebApp() {
  return getRawWebApp() ?? WebApp;
}

export function initTelegram() {
  if (initialized) return;
  initialized = true;
  try {
    getWebApp().ready();
    getWebApp().expand();
  } catch {
    // Not running inside Telegram (e.g. local browser) — ignore.
  }
}

export function getTelegramUser(): TgUser | null {
  try {
    return getWebApp().initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

export function getTelegramId(): string {
  const user = getTelegramUser();
  if (user?.id) return String(user.id);
  return "web-guest";
}

export function getTelegramInitData(): string {
  try {
    return getWebApp().initData ?? "";
  } catch {
    return "";
  }
}

export function getTelegramLaunchInfo() {
  const webApp = getWebApp();
  const initData = getTelegramInitData();
  const user = getTelegramUser();

  return {
    hasTelegramObject: Boolean(getRawWebApp()),
    hasInitData: initData.length > 0,
    initDataLength: initData.length,
    userId: user?.id ? String(user.id) : undefined,
    platform: webApp.platform,
    version: webApp.version,
  };
}

export function getUserName(): string | undefined {
  const user = getTelegramUser();
  if (!user) return undefined;
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
}

/** Deep-link payload from `?startapp=` (Direct Link) or bot start parameter. */
export function getStartParam(): string | undefined {
  try {
    const param = getWebApp().initDataUnsafe?.start_param;
    return param?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export const tg = WebApp;
