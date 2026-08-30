import {
  api,
  getAccessToken,
} from "./api";
import { compressImageFiles } from "./imageCompress";
import { getTelegramInitData } from "./telegram";

export type AdminShop = {
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
  logoFile?: File | null;
  bannerFile?: File | null;
};

function adminAuthHeaders() {
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

async function shopFormData(
  payload: ShopPayload,
) {
  const form = new FormData();

  form.append("name", payload.name);
  form.append("slug", payload.slug);
  form.append(
    "description",
    payload.description ?? "",
  );
  form.append(
    "backgroundColor",
    payload.backgroundColor,
  );
  form.append(
    "textColor",
    payload.textColor,
  );
  form.append(
    "accentColor",
    payload.accentColor,
  );
  form.append(
    "isActive",
    String(payload.isActive),
  );

  const files = [
    payload.logoFile,
    payload.bannerFile,
  ].filter((file): file is File => Boolean(file));

  let compressed = files;

  if (files.length > 0) {
    compressed = await compressImageFiles(files);
  }

  let index = 0;

  if (payload.logoFile) {
    form.append("logo", compressed[index]);
    index += 1;
  }

  if (payload.bannerFile) {
    form.append("banner", compressed[index]);
  }

  return form;
}

export async function getAdminShops(): Promise<
  AdminShop[]
> {
  const res = await api.get<AdminShop[]>(
    "/shops/admin/all",
    {
      headers: adminAuthHeaders(),
    },
  );

  return res.data;
}

export async function createShop(
  payload: ShopPayload,
): Promise<AdminShop> {
  const res = await api.post<AdminShop>(
    "/shops",
    await shopFormData(payload),
    {
      headers: adminAuthHeaders(),
      timeout: 120000,
    },
  );

  return res.data;
}

export async function updateShop(
  id: string,
  payload: ShopPayload,
): Promise<AdminShop> {
  const res = await api.patch<AdminShop>(
    `/shops/${id}`,
    await shopFormData(payload),
    {
      headers: adminAuthHeaders(),
      timeout: 120000,
    },
  );

  return res.data;
}
