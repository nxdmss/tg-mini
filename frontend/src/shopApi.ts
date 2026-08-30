import { api } from "./api";

import type {
  Product,
  ProductsQuery,
} from "./types";

export type Shop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount: number;
};

export async function getShop(
  slug: string,
): Promise<Shop> {
  const res = await api.get<Shop>(
    `/shops/${encodeURIComponent(slug)}`,
  );

  return res.data;
}

export async function getShopProducts(
  slug: string,
  query: ProductsQuery = {},
): Promise<Product[]> {
  const params: Record<string, string> = {
    shop: slug,
  };

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
