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

type ErrorPayload = {
  message?:
    | string
    | string[];
};

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.name =
      "ApiError";
    this.status =
      status;
  }
}

export function getAccessToken() {
  return localStorage.getItem(
    TOKEN_KEY,
  );
}

export function saveAccessToken(
  token: string,
) {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );
}

export function clearAccessToken() {
  localStorage.removeItem(
    TOKEN_KEY,
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
) {
  const headers =
    new Headers(
      options.headers,
    );

  if (
    options.body &&
    !headers.has(
      "Content-Type",
    )
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  let response: Response;

  try {
    response =
      await fetch(
        `${API_URL}${path}`,
        {
          ...options,
          headers,
        },
      );
  } catch {
    throw new ApiError(
      0,
      "Нет соединения с API",
    );
  }

  if (!response.ok) {
    let message =
      `API ${response.status}`;

    try {
      const data =
        (await response.json()) as
          ErrorPayload;

      if (
        Array.isArray(
          data.message,
        )
      ) {
        message =
          data.message.join(
            ", ",
          );
      } else if (
        typeof data.message ===
        "string"
      ) {
        message =
          data.message;
      }
    } catch {
      // Keep the HTTP fallback.
    }

    throw new ApiError(
      response.status,
      message,
    );
  }

  if (
    response.status ===
    204
  ) {
    return undefined as T;
  }

  return (
    (await response.json()) as T
  );
}

function authHeaders(
  token: string,
) {
  return {
    Authorization:
      `Bearer ${token}`,
  };
}

export async function loginAdmin(
  email: string,
  password: string,
) {
  return request<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );
}

export async function checkAdmin(
  token: string,
) {
  await request(
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
  return request<Order[]>(
    "/orders/admin",
    {
      headers:
        authHeaders(token),
    },
  );
}

export async function updateAdminOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
) {
  return request<Order>(
    `/orders/admin/${orderId}/status`,
    {
      method: "PATCH",
      headers:
        authHeaders(token),
      body: JSON.stringify({
        status,
      }),
    },
  );
}

export async function setAdminOrderArchived(
  token: string,
  orderId: string,
  archived: boolean,
) {
  return request<Order>(
    `/orders/admin/${orderId}/archive`,
    {
      method: "PATCH",
      headers:
        authHeaders(token),
      body: JSON.stringify({
        archived,
      }),
    },
  );
}

export async function deleteAdminOrderItem(
  token: string,
  orderId: string,
  itemId: string,
) {
  return request<Order>(
    `/orders/admin/${orderId}/items/${itemId}`,
    {
      method: "DELETE",
      headers:
        authHeaders(token),
    },
  );
}

export async function deleteAdminOrder(
  token: string,
  orderId: string,
) {
  return request<{
    ok: true;
    id: string;
  }>(
    `/orders/admin/${orderId}`,
    {
      method: "DELETE",
      headers:
        authHeaders(token),
    },
  );
}

export function getApiErrorMessage(
  error: unknown,
) {
  if (
    error instanceof ApiError
  ) {
    return error.message;
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Ошибка соединения";
}

export function isAuthError(
  error: unknown,
) {
  return (
    error instanceof ApiError &&
    (
      error.status === 401 ||
      error.status === 403
    )
  );
}
