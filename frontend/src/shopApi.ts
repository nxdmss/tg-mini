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
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount: number;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

let currentShopsCache:
  CacheEntry<Shop[]> | null =
  null;

const shopCache =
  new Map<
    string,
    CacheEntry<Shop>
  >();

const productCache =
  new Map<
    string,
    CacheEntry<Product[]>
  >();

const inflight =
  new Map<
    string,
    Promise<unknown>
  >();

const SHOPS_TTL_MS =
  60_000;

const PRODUCTS_TTL_MS =
  15_000;

function isFresh<T>(
  entry:
    | CacheEntry<T>
    | null
    | undefined,
): entry is CacheEntry<T> {
  return Boolean(
    entry &&
      entry.expiresAt >
        Date.now(),
  );
}

function keepCacheSmall<T>(
  cache: Map<
    string,
    CacheEntry<T>
  >,
  limit: number,
) {
  while (
    cache.size > limit
  ) {
    const firstKey =
      cache.keys().next()
        .value as
        | string
        | undefined;

    if (!firstKey) {
      return;
    }

    cache.delete(firstKey);
  }
}

function productsKey(
  slug: string,
  query: ProductsQuery,
) {
  return JSON.stringify([
    slug,
    query.category ?? "",
    query.brand ?? "",
    query.search ?? "",
    query.sort ?? "",
    query.inStock ?? null,
  ]);
}

async function dedupe<T>(
  key: string,
  request: () => Promise<T>,
): Promise<T> {
  const running =
    inflight.get(key) as
      | Promise<T>
      | undefined;

  if (running) {
    return running;
  }

  const next =
    request().finally(() => {
      inflight.delete(key);
    });

  inflight.set(
    key,
    next,
  );

  return next;
}

export async function getShops(): Promise<Shop[]> {
  if (
    isFresh(
      currentShopsCache,
    )
  ) {
    return currentShopsCache.value;
  }

  return dedupe(
    "shops:list",
    async () => {
      const res =
        await api.get<Shop[]>(
          "/shops",
        );

      currentShopsCache = {
        value: res.data,
        expiresAt:
          Date.now() +
          SHOPS_TTL_MS,
      };

      res.data.forEach(
        (shop) => {
          shopCache.set(
            shop.slug,
            {
              value: shop,
              expiresAt:
                Date.now() +
                SHOPS_TTL_MS,
            },
          );
        },
      );

      return res.data;
    },
  );
}

export async function getShop(
  slug: string,
): Promise<Shop> {
  const cached =
    shopCache.get(slug);

  if (isFresh(cached)) {
    return cached.value;
  }

  /*
   * On first boot getShops() usually starts just before getShop().
   * Reuse that request instead of hitting /shops/:slug in parallel.
   */
  const listRequest =
    inflight.get(
      "shops:list",
    ) as
      | Promise<Shop[]>
      | undefined;

  if (listRequest) {
    const list =
      await listRequest;

    const fromList =
      list.find(
        (item) =>
          item.slug === slug,
      );

    if (fromList) {
      return fromList;
    }
  }

  return dedupe(
    `shop:${slug}`,
    async () => {
      const res =
        await api.get<Shop>(
          `/shops/${encodeURIComponent(
            slug,
          )}`,
        );

      shopCache.set(
        slug,
        {
          value: res.data,
          expiresAt:
            Date.now() +
            SHOPS_TTL_MS,
        },
      );

      keepCacheSmall(
        shopCache,
        24,
      );

      return res.data;
    },
  );
}

export async function getShopProducts(
  slug: string,
  query: ProductsQuery = {},
): Promise<Product[]> {
  const key =
    productsKey(
      slug,
      query,
    );

  const cached =
    productCache.get(key);

  if (isFresh(cached)) {
    return cached.value;
  }

  const params: Record<
    string,
    string
  > = {
    shop: slug,
  };

  if (query.category) {
    params.category =
      query.category;
  }

  if (query.brand) {
    params.brand =
      query.brand;
  }

  if (query.search) {
    params.search =
      query.search;
  }

  if (query.sort) {
    params.sort =
      query.sort;
  }

  if (
    query.inStock !==
    undefined
  ) {
    params.inStock =
      String(query.inStock);
  }

  return dedupe(
    `products:${key}`,
    async () => {
      const res =
        await api.get<Product[]>(
          "/products",
          {
            params,
          },
        );

      productCache.set(
        key,
        {
          value: res.data,
          expiresAt:
            Date.now() +
            PRODUCTS_TTL_MS,
        },
      );

      keepCacheSmall(
        productCache,
        40,
      );

      return res.data;
    },
  );
}

export function clearShopApiCache() {
  currentShopsCache = null;
  shopCache.clear();
  productCache.clear();
}
