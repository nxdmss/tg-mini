import axios from "axios";
import { compressImageFiles } from "./imageCompress";
import {
  getTelegramInitData,
  getTelegramLaunchInfo,
} from "./telegram";

import type {
  AdminOrder,
  AuthUser,
  Brand,
  Category,
  Order,
  OrderStatus,
  Product,
  ProductsQuery,
} from "./types";

/* =========================================================
   API
========================================================= */

const rawApiURL = import.meta.env.VITE_API_URL?.trim();

const baseURL = (
  rawApiURL || "http://localhost:3000"
).replace(/\/+$/, "");

export const api = axios.create({
  baseURL,
  timeout: 45000,
});

/* =========================================================
   ACCESS TOKEN
========================================================= */

const ACCESS_TOKEN_KEY = "swa6y5tan_access_token";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isWebLoggedIn() {
  return Boolean(getAccessToken());
}

/* =========================================================
   AXIOS INTERCEPTOR
========================================================= */

api.interceptors.request.use((config) => {
  if (
    config.data instanceof FormData &&
    config.headers
  ) {
    delete config.headers["Content-Type"];
  }

  return config;
});

/* =========================================================
   AUTH HEADERS
========================================================= */

function authHeaders() {
  const initData = getTelegramInitData();

  if (initData) {
    return {
      "x-telegram-init-data": initData,
    };
  }

  const accessToken = getAccessToken();

  if (accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return {};
}

/* =========================================================
   RETRY
========================================================= */

function isRetryableError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (
    !error.response ||
    error.code === "ECONNABORTED"
  ) {
    return true;
  }

  const status = error.response.status;

  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 429
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
) {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (
        attempt === retries ||
        !isRetryableError(error)
      ) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          1400 * (attempt + 1),
        ),
      );
    }
  }

  throw lastError;
}

/* =========================================================
   WEB AUTH
========================================================= */

export type WebUser = {
  id: string;
  telegramId?: string | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role: string;
};

export type WebAuthResponse = {
  accessToken: string;
  user: WebUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function register(
  payload: RegisterPayload,
): Promise<WebAuthResponse> {
  const res = await api.post<WebAuthResponse>(
    "/auth/register",
    payload,
  );

  setAccessToken(res.data.accessToken);

  return res.data;
}

export async function login(
  payload: LoginPayload,
): Promise<WebAuthResponse> {
  const res = await api.post<WebAuthResponse>(
    "/auth/login",
    payload,
  );

  setAccessToken(res.data.accessToken);

  return res.data;
}

export function logout() {
  clearAccessToken();
}

/* =========================================================
   PRODUCTS
========================================================= */

export async function getProducts(
  query: ProductsQuery = {},
): Promise<Product[]> {
  const params: Record<string, string> = {};

  if (query.category) {
    params.category = query.category;
  }

  if (query.brand) {
    params.brand = query.brand;
  }

  if (query.search) {
    params.search = query.search;
  }

  if (query.sort) {
    params.sort = query.sort;
  }

  if (query.inStock !== undefined) {
    params.inStock = String(query.inStock);
  }

  const res = await api.get<Product[]>(
    "/products",
    {
      params,
    },
  );

  return res.data;
}

export async function getProduct(
  id: string,
): Promise<Product> {
  const res = await api.get<Product>(
    `/products/${id}`,
  );

  return res.data;
}

/* =========================================================
   CATEGORIES
========================================================= */

export async function getCategories(): Promise<
  Category[]
> {
  const res = await api.get<Category[]>(
    "/categories",
  );

  return res.data;
}

/* =========================================================
   BRANDS
========================================================= */

export async function getBrands(): Promise<
  Brand[]
> {
  const res = await api.get<Brand[]>("/brands");

  return res.data;
}

export async function createBrand(
  name: string,
): Promise<Brand> {
  const res = await api.post<Brand>(
    "/brands",
    {
      name,
    },
    {
      headers: authHeaders(),
    },
  );

  return res.data;
}

export async function createCategory(
  name: string,
): Promise<Category> {
  const res = await api.post<Category>(
    "/categories",
    {
      name,
    },
    {
      headers: authHeaders(),
    },
  );

  return res.data;
}

export async function deleteBrand(
  id: string,
): Promise<void> {
  await api.delete(`/brands/${id}`, {
    headers: authHeaders(),
  });
}

export async function deleteCategory(
  id: string,
): Promise<void> {
  await api.delete(`/categories/${id}`, {
    headers: authHeaders(),
  });
}

/* =========================================================
   ORDERS
========================================================= */

export type CreateOrderPayload = {
  name?: string;
  phone?: string;
  deliveryMethod?: string;
  address?: string;
  comment?: string;

  items: {
    productId: string;
    quantity: number;
    size?: string;
  }[];
};

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<Order> {
  const res = await api.post<Order>(
    "/orders",
    payload,
    {
      headers: authHeaders(),
    },
  );

  return res.data;
}

/* =========================================================
   API ERRORS
========================================================= */

export function getApiErrorMessage(
  error: unknown,
) {
  if (!axios.isAxiosError(error)) {
    return "Не удалось выполнить запрос. Попробуйте ещё раз.";
  }

  const status = error.response?.status;

  const message =
    error.response?.data?.message;

  const normalizedMessage = Array.isArray(
    message,
  )
    ? message.join(" ")
    : String(message ?? "");

  const backendError =
    normalizedMessage ||
    error.response?.data?.error;

  if (status === 401) {
    const launchInfo =
      getTelegramLaunchInfo();

    if (
      launchInfo.isTelegram &&
      !launchInfo.hasInitData
    ) {
      return "Telegram не передал данные входа.";
    }

    return "Неверные данные входа или сессия истекла.";
  }

  if (status === 409) {
    return (
      normalizedMessage ||
      "Такой пользователь уже существует."
    );
  }

  if (
    status === 400 &&
    normalizedMessage.includes("phone")
  ) {
    return "Введите телефон в правильном формате.";
  }

  if (
    status === 400 &&
    normalizedMessage.includes("address")
  ) {
    return "Для доставки нужен адрес.";
  }

  if (
    status === 400 &&
    normalizedMessage.includes("Size")
  ) {
    return "Этот размер уже недоступен.";
  }

  if (
    status === 400 &&
    normalizedMessage.includes("out of stock")
  ) {
    return "Товар закончился.";
  }

  if (!error.response) {
    return "Сервер не ответил. Проверьте подключение.";
  }

  if (
    status === 400 &&
    /cloudinary/i.test(String(backendError))
  ) {
    return "Не удалось загрузить фото.";
  }

  if (
    status &&
    backendError
  ) {
    return `Ошибка сервера (${status}): ${backendError}`;
  }

  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}

/* =========================================================
   CURRENT USER
========================================================= */

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>(
    "/auth/me",
    {
      headers: authHeaders(),
    },
  );

  return res.data;
}

/* =========================================================
   PRODUCT FORM
========================================================= */

export type ProductFormPayload = {
  name: string;
  price: number;
  description?: string;
  brandId: string;
  categoryId: string;
  inStock: boolean;
  sizes: string[];
  imageItems: ProductImageItem[];
};

export type ProductImageItem =
  | {
      key: string;
      type: "url";
      url: string;
    }
  | {
      key: string;
      type: "file";
      file: File;
    };

function productFormData(
  payload: ProductFormPayload,
) {
  const form = new FormData();

  form.append(
    "name",
    payload.name,
  );

  form.append(
    "price",
    String(payload.price),
  );

  form.append(
    "description",
    payload.description ?? "",
  );

  form.append(
    "brandId",
    payload.brandId,
  );

  form.append(
    "categoryId",
    payload.categoryId,
  );

  form.append(
    "inStock",
    String(payload.inStock),
  );

  payload.sizes.forEach((size) => {
    form.append("sizes", size);
  });

  const order: Array<
    "url" | "file"
  > = [];

  for (const item of payload.imageItems) {
    if (item.type === "url") {
      form.append(
        "images",
        item.url,
      );

      order.push("url");
    } else {
      form.append(
        "images",
        item.file,
      );

      order.push("file");
    }
  }

  if (order.length > 0) {
    form.append(
      "imagesOrder",
      JSON.stringify(order),
    );
  }

  return form;
}

/* =========================================================
   IMAGE COMPRESSION
========================================================= */

async function prepareProductPayload(
  payload: ProductFormPayload,
) {
  const fileItems =
    payload.imageItems.filter(
      (
        item,
      ): item is Extract<
        ProductImageItem,
        {
          type: "file";
        }
      > => item.type === "file",
    );

  if (fileItems.length === 0) {
    return payload;
  }

  const compressed =
    await compressImageFiles(
      fileItems.map(
        (item) => item.file,
      ),
    );

  const compressedByKey = new Map<
    string,
    File
  >();

  fileItems.forEach(
    (item, index) => {
      compressedByKey.set(
        item.key,
        compressed[index],
      );
    },
  );

  return {
    ...payload,

    imageItems:
      payload.imageItems.map(
        (item) =>
          item.type === "file"
            ? {
                ...item,

                file:
                  compressedByKey.get(
                    item.key,
                  ) ??
                  item.file,
              }
            : item,
      ),
  };
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function createProduct(
  payload: ProductFormPayload,

  onProgress?: (
    stage:
      | "compress"
      | "upload",
  ) => void,
): Promise<Product> {
  onProgress?.("compress");

  const prepared =
    await prepareProductPayload(
      payload,
    );

  onProgress?.("upload");

  const res = await withRetry(() =>
    api.post<Product>(
      "/products",

      productFormData(prepared),

      {
        headers: authHeaders(),
        timeout: 120000,
      },
    ),
  );

  return res.data;
}

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateProduct(
  id: string,

  payload: ProductFormPayload,

  onProgress?: (
    stage:
      | "compress"
      | "upload",
  ) => void,
): Promise<Product> {
  onProgress?.("compress");

  const prepared =
    await prepareProductPayload(
      payload,
    );

  onProgress?.("upload");

  const res = await withRetry(() =>
    api.patch<Product>(
      `/products/${id}`,

      productFormData(prepared),

      {
        headers: authHeaders(),
        timeout: 120000,
      },
    ),
  );

  return res.data;
}

/* =========================================================
   PRODUCT STOCK
========================================================= */

export type ProductStockPayload = {
  inStock: boolean;

  sizes: {
    size: string;
    stock: number;
  }[];
};

export async function updateProductStock(
  id: string,
  payload: ProductStockPayload,
): Promise<Product> {
  const res = await api.patch<Product>(
    `/products/${id}/stock`,

    payload,

    {
      headers: authHeaders(),
    },
  );

  return res.data;
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function deleteProduct(
  id: string,
): Promise<void> {
  try {
    await withRetry(() =>
      api.delete(
        `/products/${id}`,
        {
          headers: authHeaders(),
          timeout: 60000,
        },
      ),
    );
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      return;
    }

    throw error;
  }
}

/* =========================================================
   ADMIN ORDERS
========================================================= */

export async function getAdminOrders(): Promise<
  AdminOrder[]
> {
  const res = await api.get<
    AdminOrder[]
  >(
    "/orders/admin",

    {
      headers: authHeaders(),
    },
  );

  return res.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<AdminOrder> {
  const res = await api.patch<AdminOrder>(
    `/orders/admin/${id}/status`,

    {
      status,
    },

    {
      headers: authHeaders(),
    },
  );

  return res.data;
}