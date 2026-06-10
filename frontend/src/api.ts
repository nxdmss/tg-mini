import axios from "axios";
import { getTelegramInitData, getTelegramLaunchInfo } from "./telegram";
import type { AuthUser, Brand, Category, Order, Product, ProductsQuery } from "./types";

// Берем URL бэкенда из переменных окружения. Убедись, что на хостинге фронта прописан VITE_API_URL!
const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://tg-mini-backend.onrender.com";

export const api = axios.create({ baseURL, timeout: 15000 });

function authHeaders() {
  const initData = getTelegramInitData();
  return initData ? { "x-telegram-init-data": initData } : {};
}

// Полностью отключаем спасательный круг в виде моков для живых запросов
export async function getProducts(query: ProductsQuery = {}): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (query.category) params.category = query.category;
  if (query.brand) params.brand = query.brand;
  if (query.search) params.search = query.search;
  if (query.sort) params.sort = query.sort;
  if (query.inStock !== undefined) params.inStock = String(query.inStock);
  
  const res = await api.get<Product[]>("/products", { params });
  return res.data;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await api.get<Product>(`/products/${id}`);
  return res.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>("/categories");
  return res.data;
}

export async function getBrands(): Promise<Brand[]> {
  const res = await api.get<Brand[]>("/brands");
  return res.data;
}

export type CreateOrderPayload = {
  name?: string;
  phone?: string;
  deliveryMethod?: string;
  address?: string;
  comment?: string;
  items: { productId: string; quantity: number; size?: string }[];
};

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await api.post<Order>("/orders", payload, { headers: authHeaders() });
  return res.data;
}

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Не удалось выполнить запрос. Попробуйте ещё раз.";
  }

  const status = error.response?.status;
  const message = error.response?.data?.message;
  const normalizedMessage = Array.isArray(message) ? message.join(" ") : String(message ?? "");

  if (status === 401) {
    const launchInfo = getTelegramLaunchInfo();
    if (!launchInfo.hasInitData) {
      return "Telegram не передал данные входа. Откройте магазин через кнопку Mini App у бота, а не через обычную ссылку.";
    }

    return "Telegram-доступ не прошел проверку. Проверьте, что на backend токен именно этого бота.";
  }

  if (status === 400 && normalizedMessage.includes("phone")) {
    return "Введите телефон полностью, минимум 10 цифр.";
  }

  if (status === 400 && normalizedMessage.includes("address")) {
    return "Для доставки нужен адрес.";
  }

  if (status === 400 && normalizedMessage.includes("Size")) {
    return "Этот размер уже недоступен. Выберите другой товар или размер.";
  }

  if (status === 400 && normalizedMessage.includes("out of stock")) {
    return "Товар закончился. Уберите его из корзины.";
  }

  if (!error.response) {
    return "Сервер не отвечает. Проверьте интернет и попробуйте ещё раз.";
  }

  return "Не удалось оформить заказ. Попробуйте ещё раз.";
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>("/auth/me", { headers: authHeaders() });
  return res.data;
}

export type ProductFormPayload = {
  name: string;
  price: number;
  description?: string;
  brandId: string;
  categoryId: string;
  inStock: boolean;
  sizes: string[];
  existingImages?: string[];
  files?: File[];
};

function productFormData(payload: ProductFormPayload) {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("price", String(payload.price));
  form.append("description", payload.description ?? "");
  form.append("brandId", payload.brandId);
  form.append("categoryId", payload.categoryId);
  form.append("inStock", String(payload.inStock));
  payload.sizes.forEach((size) => form.append("sizes", size));
  payload.existingImages?.forEach((url) => form.append("images", url));
  payload.files?.forEach((file) => form.append("images", file));
  return form;
}

export async function createProduct(payload: ProductFormPayload): Promise<Product> {
  const res = await api.post<Product>("/products", productFormData(payload), {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateProduct(id: string, payload: ProductFormPayload): Promise<Product> {
  const res = await api.patch<Product>(`/products/${id}`, productFormData(payload), {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`, { headers: authHeaders() });
}