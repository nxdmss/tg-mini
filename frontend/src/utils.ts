export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductPreviewImage(product: { images: Array<{ url: string }> }) {
  return product.images[0]?.url;
}

/** Telegram Direct Link: opens Mini App straight on the product. */
export function getProductDeepLink(productId: string): string {
  const bot = import.meta.env.VITE_BOT_USERNAME?.replace(/^@/, "").trim();
  const app = import.meta.env.VITE_MINI_APP_SHORT_NAME?.trim();

  if (bot && app) {
    return `https://t.me/${bot}/${app}?startapp=${encodeURIComponent(productId)}`;
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  return `${origin}/product/${productId}`;
}
