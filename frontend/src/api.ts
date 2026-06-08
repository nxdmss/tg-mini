import axios from "axios";
import type { Brand, Category, Product, ProductsQuery } from "./types";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const api = axios.create({ baseURL });

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

export async function createOrder(payload: CreateOrderPayload) {
  const res = await api.post("/orders", payload);
  return res.data;
}
