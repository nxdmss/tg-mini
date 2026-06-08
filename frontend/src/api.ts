import axios from "axios";
import type { Brand, Category, Order, Product, ProductsQuery } from "./types";
import { filterMockProducts, MOCK_CATEGORIES } from "./mock";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const api = axios.create({ baseURL, timeout: 4000 });

let useMock = import.meta.env.VITE_USE_MOCK === "true";

async function withFallback<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
  if (useMock) return fallback();
  try {
    return await fn();
  } catch {
    useMock = true;
    return fallback();
  }
}

export async function getProducts(query: ProductsQuery = {}): Promise<Product[]> {
  return withFallback(
    async () => {
      const params: Record<string, string> = {};
      if (query.category) params.category = query.category;
      if (query.brand) params.brand = query.brand;
      if (query.search) params.search = query.search;
      if (query.sort) params.sort = query.sort;
      const res = await api.get<Product[]>("/products", { params });
      return res.data;
    },
    () => filterMockProducts(query),
  );
}

export async function getProduct(id: string): Promise<Product> {
  return withFallback(
    async () => {
      const res = await api.get<Product>(`/products/${id}`);
      return res.data;
    },
    () => {
      const p = filterMockProducts().find((x) => x.id === id);
      if (!p) throw new Error("Not found");
      return p;
    },
  );
}

export async function getCategories(): Promise<Category[]> {
  return withFallback(
    async () => {
      const res = await api.get<Category[]>("/categories");
      return res.data;
    },
    () => MOCK_CATEGORIES,
  );
}

export async function getBrands(): Promise<Brand[]> {
  return withFallback(
    async () => {
      const res = await api.get<Brand[]>("/brands");
      return res.data;
    },
    () => {
      const seen = new Map<string, Brand>();
      filterMockProducts().forEach((p) => {
        if (!seen.has(p.brand.id)) seen.set(p.brand.id, p.brand);
      });
      return [...seen.values()];
    },
  );
}

export type CreateOrderPayload = {
  telegramId: string;
  name?: string;
  phone?: string;
  items: { productId: string; quantity: number; size?: string }[];
};

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 800));
    return { id: "mock-order", status: "PENDING", createdAt: new Date().toISOString() };
  }
  const res = await api.post<Order>("/orders", payload);
  return res.data;
}
