import { api } from "./api";
import { getTelegramAdminHeaders } from "./adminAuth";
import { clearShopApiCache } from "./shopApi";

export type AdminShop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ShopPayload = {
  name: string;
  slug: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  isActive: boolean;
};

export async function getAdminShops(): Promise<AdminShop[]> {
  const res = await api.get<AdminShop[]>("/shops/admin/all", {
    headers: getTelegramAdminHeaders(),
  });

  return res.data;
}

export async function createShop(payload: ShopPayload): Promise<AdminShop> {
  const res = await api.post<AdminShop>("/shops", payload, {
    headers: getTelegramAdminHeaders(),
  });

  clearShopApiCache();
  return res.data;
}

export async function updateShop(
  id: string,
  payload: ShopPayload,
): Promise<AdminShop> {
  const res = await api.patch<AdminShop>(`/shops/${id}`, payload, {
    headers: getTelegramAdminHeaders(),
  });

  clearShopApiCache();
  return res.data;
}

export async function deleteShop(id: string): Promise<void> {
  await api.delete(`/shops/${id}`, {
    headers: getTelegramAdminHeaders(),
  });

  clearShopApiCache();
}
