import { api, type ProductFormPayload, type ProductImageItem } from "./api";
import { getTelegramAdminHeaders } from "./adminAuth";
import { compressImageFiles } from "./imageCompress";
import { clearShopApiCache } from "./shopApi";
import type { Product } from "./types";

export type AdminProductPayload = ProductFormPayload & {
  shopId: string;
};

function productFormData(payload: AdminProductPayload) {
  const form = new FormData();

  form.append("shopId", payload.shopId);
  form.append("name", payload.name);
  form.append("price", String(payload.price));
  form.append("description", payload.description ?? "");
  form.append("brandId", payload.brandId);
  form.append("categoryId", payload.categoryId);
  form.append("inStock", String(payload.inStock));

  if (payload.sizes.length === 0) {
    form.append("sizes", "");
  } else {
    payload.sizes.forEach((size) => form.append("sizes", size));
  }

  const order: Array<"url" | "file"> = [];

  for (const item of payload.imageItems) {
    if (item.type === "url") {
      form.append("images", item.url);
      order.push("url");
    } else {
      form.append("images", item.file);
      order.push("file");
    }
  }

  if (order.length === 0) {
    form.append("images", "");
    form.append("imagesOrder", "[]");
  } else {
    form.append("imagesOrder", JSON.stringify(order));
  }

  return form;
}

async function preparePayload(payload: AdminProductPayload) {
  const fileItems = payload.imageItems.filter(
    (item): item is Extract<ProductImageItem, { type: "file" }> =>
      item.type === "file",
  );

  if (fileItems.length === 0) {
    return payload;
  }

  const compressed = await compressImageFiles(
    fileItems.map((item) => item.file),
  );

  const compressedByKey = new Map<string, File>();

  fileItems.forEach((item, index) => {
    compressedByKey.set(item.key, compressed[index]);
  });

  return {
    ...payload,
    imageItems: payload.imageItems.map((item) =>
      item.type === "file"
        ? {
            ...item,
            file: compressedByKey.get(item.key) ?? item.file,
          }
        : item,
    ),
  };
}

export async function createAdminProduct(
  payload: AdminProductPayload,
): Promise<Product> {
  const prepared = await preparePayload(payload);

  const res = await api.post<Product>("/products", productFormData(prepared), {
    headers: getTelegramAdminHeaders(),
    timeout: 120000,
  });

  clearShopApiCache();
  return res.data;
}

export async function updateAdminProduct(
  id: string,
  payload: AdminProductPayload,
): Promise<Product> {
  const prepared = await preparePayload(payload);

  const res = await api.patch<Product>(
    `/products/${id}`,
    productFormData(prepared),
    {
      headers: getTelegramAdminHeaders(),
      timeout: 120000,
    },
  );

  clearShopApiCache();
  return res.data;
}

export async function moveAdminProductToShop(
  id: string,
  shopId: string,
): Promise<Product> {
  const res = await api.patch<Product>(
    `/products/${id}`,
    { shopId },
    {
      headers: getTelegramAdminHeaders(),
    },
  );

  clearShopApiCache();
  return res.data;
}
