import axios from "axios";

import type {
  AuthResponse,
  Order,
  OrderStatus,
} from "./types";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://api.swagystan.ru"
).replace(/\/+$/, "");

const TOKEN_KEY =
  "swa6_admin_access_token";

const client = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
});

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(
  token: string,
) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function loginAdmin(
  email: string,
  password: string,
) {
  const response =
    await client.post<AuthResponse>(
      "/auth/login",
      {
        email,
        password,
      },
    );

  return response.data;
}

export async function checkAdmin(
  token: string,
) {
  await client.get(
    "/auth/admin-check",
    {
      headers:
        authHeaders(token),
    },
  );
}

export async function getAdminOrders(
  token: string,
) {
  const response =
    await client.get<Order[]>(
      "/orders/admin",
      {
        headers:
          authHeaders(token),
      },
    );

  return response.data;
}

export async function updateAdminOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
) {
  const response =
    await client.patch<Order>(
      `/orders/admin/${orderId}/status`,
      {
        status,
      },
      {
        headers:
          authHeaders(token),
      },
    );

  return response.data;
}

export function getApiErrorMessage(
  error: unknown,
) {
  if (!axios.isAxiosError(error)) {
    return "Ошибка соединения";
  }

  const data =
    error.response?.data as
      | {
          message?:
            | string
            | string[];
        }
      | undefined;

  if (
    Array.isArray(
      data?.message,
    )
  ) {
    return data.message.join(", ");
  }

  if (
    typeof data?.message ===
    "string"
  ) {
    return data.message;
  }

  if (!error.response) {
    return "Нет соединения с API";
  }

  return `API ${error.response.status}`;
}

export function isAuthError(
  error: unknown,
) {
  return (
    axios.isAxiosError(error) &&
    (
      error.response?.status ===
        401 ||
      error.response?.status ===
        403
    )
  );
}
