import type {
  Product,
  ProductsQuery,
} from "./types";

import {
  getShopProducts,
} from "./shopApi";
import type {
  Shop,
} from "./shopApi";

export type CatalogScene = {
  shop: Shop;
  products: Product[];
  cachedAt: number;
};

type SceneStore = Record<
  string,
  CatalogScene
>;

const SESSION_KEY =
  "swag:catalog-scenes:v2";

const memory =
  new Map<string, CatalogScene>();

const inflight =
  new Map<
    string,
    Promise<CatalogScene>
  >();

let hydrated = false;

function keyFor(
  slug: string,
  sort:
    | ProductsQuery["sort"]
    | undefined,
) {
  return `${slug}::${
    sort || "name_asc"
  }`;
}

function hydrateSession() {
  if (
    hydrated ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  hydrated = true;

  try {
    const raw =
      window.sessionStorage.getItem(
        SESSION_KEY,
      );

    if (!raw) {
      return;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as SceneStore;

    Object.entries(
      parsed,
    ).forEach(
      ([key, scene]) => {
        if (
          scene?.shop &&
          Array.isArray(
            scene.products,
          )
        ) {
          memory.set(
            key,
            scene,
          );
        }
      },
    );
  } catch {
    // Broken session cache should never break the app.
  }
}

function persistSession() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const data:
      SceneStore = {};

    memory.forEach(
      (scene, key) => {
        data[key] =
          scene;
      },
    );

    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(
        data,
      ),
    );
  } catch {
    // sessionStorage can be unavailable or full.
  }
}

export function getCatalogScene(
  slug: string,
  sort:
    | ProductsQuery["sort"]
    | undefined,
) {
  hydrateSession();

  return (
    memory.get(
      keyFor(
        slug,
        sort,
      ),
    ) || null
  );
}

export function setCatalogScene(
  scene: Omit<
    CatalogScene,
    "cachedAt"
  >,
  sort:
    | ProductsQuery["sort"]
    | undefined,
) {
  hydrateSession();

  const next:
    CatalogScene = {
      ...scene,
      cachedAt:
        Date.now(),
    };

  memory.set(
    keyFor(
      scene.shop.slug,
      sort,
    ),
    next,
  );

  persistSession();

  return next;
}

function uniqueImageUrls(
  products: Product[],
) {
  const urls =
    new Set<string>();

  products.forEach(
    (product) => {
      product.images?.forEach(
        (image) => {
          if (image?.url) {
            urls.add(
              image.url,
            );
          }
        },
      );
    },
  );

  return [
    ...urls,
  ];
}

async function decodeImage(
  url: string,
) {
  if (
    typeof window ===
      "undefined"
  ) {
    return;
  }

  await new Promise<void>(
    (resolve) => {
      const image =
        new Image();

      image.decoding =
        "async";

      image.onload =
        () => {
          if (
            typeof image.decode ===
            "function"
          ) {
            image
              .decode()
              .catch(
                () =>
                  undefined,
              )
              .finally(
                resolve,
              );

            return;
          }

          resolve();
        };

      image.onerror =
        () => resolve();

      image.src = url;

      if (image.complete) {
        image.onload?.(
          new Event(
            "load",
          ),
        );
      }
    },
  );
}

export async function warmSceneImages(
  products: Product[],
) {
  const urls =
    uniqueImageUrls(
      products,
    );

  /*
   * Decode in small batches.
   * This fills the browser image cache without creating
   * a huge main-thread/network spike.
   */
  const CONCURRENCY = 6;

  for (
    let index = 0;
    index < urls.length;
    index += CONCURRENCY
  ) {
    const batch =
      urls.slice(
        index,
        index +
          CONCURRENCY,
      );

    await Promise.allSettled(
      batch.map(
        decodeImage,
      ),
    );
  }
}

export async function ensureCatalogScene(
  shop: Shop,
  sort:
    | ProductsQuery["sort"]
    | undefined,
  options?: {
    forceRefresh?: boolean;
    warmImages?: boolean;
  },
) {
  hydrateSession();

  const key =
    keyFor(
      shop.slug,
      sort,
    );

  const existing =
    memory.get(key);

  if (
    existing &&
    !options?.forceRefresh
  ) {
    if (
      options?.warmImages
    ) {
      await warmSceneImages(
        existing.products,
      );
    }

    return existing;
  }

  const running =
    inflight.get(key);

  if (running) {
    return running;
  }

  const request =
    getShopProducts(
      shop.slug,
      {
        sort:
          sort ||
          "name_asc",
      },
    )
      .then(
        async (
          products,
        ) => {
          const scene =
            setCatalogScene(
              {
                shop,
                products,
              },
              sort,
            );

          if (
            options?.warmImages !==
            false
          ) {
            await warmSceneImages(
              products,
            );
          }

          return scene;
        },
      )
      .finally(() => {
        inflight.delete(
          key,
        );
      });

  inflight.set(
    key,
    request,
  );

  return request;
}

export async function primeCatalogScenes(
  shops: Shop[],
  sort:
    | ProductsQuery["sort"]
    | undefined,
) {
  const active =
    shops.filter(
      (shop) =>
        shop.isActive,
    );

  /*
   * Products load in parallel.
   * Image decoding is handled inside every scene in controlled batches.
   */
  const results =
    await Promise.allSettled(
      active.map(
        (shop) =>
          ensureCatalogScene(
            shop,
            sort,
            {
              warmImages:
                true,
            },
          ),
      ),
    );

  return results;
}

export function areCatalogScenesReady(
  shops: Shop[],
  sort:
    | ProductsQuery["sort"]
    | undefined,
) {
  hydrateSession();

  return shops
    .filter(
      (shop) =>
        shop.isActive,
    )
    .every(
      (shop) =>
        memory.has(
          keyFor(
            shop.slug,
            sort,
          ),
        ),
    );
}
