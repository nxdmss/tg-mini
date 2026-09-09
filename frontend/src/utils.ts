export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function optimizeCloudinaryPreview(
  url: string,
) {
  if (
    !url.includes(
      "res.cloudinary.com",
    ) ||
    !url.includes(
      "/image/upload/",
    )
  ) {
    return url;
  }

  /*
   * Product cards never need the original multi-megapixel upload.
   * Cloudinary generates a cached, browser-native format preview instead.
   */
  const width =
    typeof window !==
      "undefined" &&
    window.innerWidth >= 768
      ? 960
      : 720;

  const transformation =
    `f_auto,q_auto:good,c_limit,w_${width}`;

  if (
    url.includes(
      `/image/upload/${transformation}/`,
    )
  ) {
    return url;
  }

  return url.replace(
    "/image/upload/",
    `/image/upload/${transformation}/`,
  );
}

export function getProductPreviewImage(product: {
  images: Array<{ url: string }>;
}) {
  const url =
    product.images[0]?.url;

  return url
    ? optimizeCloudinaryPreview(
        url,
      )
    : undefined;
}

/** Telegram Direct Link: opens Mini App straight on the product. */
export function getProductDeepLink(productId: string): string {
  const bot =
    import.meta.env.VITE_BOT_USERNAME?.replace(/^@/, "").trim() || "swa6ybot";
  const app = import.meta.env.VITE_MINI_APP_SHORT_NAME?.trim() || "swa6";

  return `https://t.me/${bot}/${app}?startapp=${encodeURIComponent(productId)}`;
}
