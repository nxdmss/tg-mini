import {
  api,
  getAccessToken,
} from "./api";

import {
  getTelegramInitData,
} from "./telegram";

import type {
  Order,
} from "./types";

function orderAuthHeaders() {
  const initData =
    getTelegramInitData();

  if (initData) {
    return {
      "x-telegram-init-data":
        initData,
    };
  }

  const token =
    getAccessToken();

  if (token) {
    return {
      Authorization:
        `Bearer ${token}`,
    };
  }

  return {};
}

export async function getMyOrders(): Promise<Order[]> {
  const response =
    await api.get<Order[]>(
      "/orders/me",
      {
        headers:
          orderAuthHeaders(),
      },
    );

  return response.data;
}