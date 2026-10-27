import { api } from "./api";
import { getTelegramInitData } from "./telegram";
import { getAccessToken } from "./api";

export function getAdminAccessHeaders(): Record<string, string> {
  const initData = getTelegramInitData();
  if (initData) return { "x-telegram-init-data": initData };
  const token = getAccessToken();
  if (token) return { Authorization: `Bearer ${token}` };
  throw new Error("ADMIN_AUTH_REQUIRED");
}

export async function checkAdminAccess(): Promise<void> {
  await api.get("/auth/admin-check", {
    headers: getAdminAccessHeaders(),
  });
}
