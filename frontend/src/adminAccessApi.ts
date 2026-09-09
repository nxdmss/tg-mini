import {
  api,
  getAccessToken,
} from "./api";

import {
  getTelegramInitData,
} from "./telegram";

function adminAuthHeaders() {
  const initData =
    getTelegramInitData();

  if (initData) {
    return {
      "x-telegram-init-data":
        initData,
    };
  }

  const accessToken =
    getAccessToken();

  if (accessToken) {
    return {
      Authorization:
        `Bearer ${accessToken}`,
    };
  }

  return {};
}

export async function
checkAdminAccess(): Promise<void> {
  await api.get(
    "/auth/admin-check",
    {
      headers:
        adminAuthHeaders(),
    },
  );
}
