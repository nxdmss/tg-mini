import axios from "axios";
import type { Brand, Category, Order, Product, ProductsQuery } from "./types";

// Берем URL бэкенда из переменных окружения. Убедись, что на хостинге фронта прописан VITE_API_URL!
const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://tg-mini-backend.onrender.com";

export const api = axios.create({ baseURL, timeout: 5000 });

// Полностью отключаем спасательный круг в виде моков для живых запросов
export async function getProducts(query: ProductsQuery = {}): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (query.category) params.category = query.category;
  if (query.brand) params.brand = query.brand;
  if (query.search) params.search = query.search;
  if (query.sort) params.sort = query.sort;
  
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
  telegramId: string;
  name?: string;
  phone?: string;
  items: { productId: string; quantity: number; size?: string }[];
};

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await api.post<Order>("/orders", payload);
  return res.data;
}