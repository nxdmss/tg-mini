import WebApp from "@twa-dev/sdk";
import { isTelegram } from "./platform";

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

let initialized = false;

function getRawWebApp() {
  return (
    window as unknown as {
      Telegram?: {
        WebApp?: typeof WebApp;
      };
    }
  ).Telegram?.WebApp;
}

function getWebApp() {
  return getRawWebApp() ?? WebApp;
}

export function initTelegram() {
  if (initialized) {
    return;
  }

  initialized = true;

  if (!isTelegram()) {
    return;
  }

  try {
    const webApp = getWebApp();

    webApp.ready();
    webApp.expand();
  } catch (error) {
    console.error("Telegram WebApp init error:", error);
  }
}

export function getTelegramUser(): TgUser | null {
  if (!isTelegram()) {
    return null;
  }

  try {
    return getWebApp().initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

export function getTelegramId(): string | null {
  const user = getTelegramUser();

  if (!user?.id) {
    return null;
  }

  return String(user.id);
}

export function getTelegramInitData(): string {
  if (!isTelegram()) {
    return "";
  }

  try {
    return getWebApp().initData ?? "";
  } catch {
    return "";
  }
}

export function getTelegramLaunchInfo() {
  if (!isTelegram()) {
    return {
      isTelegram: false,
      hasTelegramObject: false,
      hasInitData: false,
      initDataLength: 0,
      userId: undefined,
      platform: "web",
      version: undefined,
    };
  }

  const webApp = getWebApp();
  const initData = getTelegramInitData();
  const user = getTelegramUser();

  return {
    isTelegram: true,
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

  if (!user) {
    return undefined;
  }

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || undefined;
}

export function getStartParam(): string | undefined {
  if (!isTelegram()) {
    return undefined;
  }

  try {
    const param = getWebApp().initDataUnsafe?.start_param;

    return param?.trim() || undefined;
  } catch {
    return undefined;
  }
}

let startParamConsumed = false;

export function consumeStartParam(): string | undefined {
  if (startParamConsumed) {
    return undefined;
  }

  const param = getStartParam();

  if (!param) {
    return undefined;
  }

  startParamConsumed = true;

  return param;
}

export const tg = WebApp;