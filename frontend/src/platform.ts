export type AppPlatform = "telegram" | "web";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      platform?: string;
      version?: string;
    };
  };
};

export function isTelegram(): boolean {
  const telegramWindow = window as TelegramWindow;

  return Boolean(
    telegramWindow.Telegram?.WebApp &&
      telegramWindow.Telegram.WebApp.initData,
  );
}

export function isWeb(): boolean {
  return !isTelegram();
}

export function getAppPlatform(): AppPlatform {
  return isTelegram() ? "telegram" : "web";
}