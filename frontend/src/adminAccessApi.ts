import { api } from "./api";
import { getTelegramAdminHeaders } from "./adminAuth";

export async function checkAdminAccess(): Promise<void> {
  await api.get("/auth/admin-check", {
    headers: getTelegramAdminHeaders(),
  });
}
