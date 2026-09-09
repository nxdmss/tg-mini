export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

function isCloudinaryImage(url: string) {
  return (
    url.includes("res.cloudinary.com") &&
    url.includes(CLOUDINARY_UPLOAD_MARKER)
  );
}

function cloudinaryPreview(url: string, width: number) {
  if (!isCloudinaryImage(url)) {
    return url;
  }

  const transformation = `f_auto,q_auto:good,c_limit,w_${width}`;

  return url.replace(
    CLOUDINARY_UPLOAD_MARKER,
    `${CLOUDINARY_UPLOAD_MARKER}${transformation}/`,
  );
}

export function getProductPreviewImage(product: {
  images: Array<{ url: string }>;
}) {
  const url = product.images[0]?.url;

  if (!url) {
    return undefined;
  }

  const width =
    typeof window !== "undefined" && window.innerWidth >= 768 ? 960 : 720;

  return cloudinaryPreview(url, width);
}

export function getProductPreviewSrcSet(product: {
  images: Array<{ url: string }>;
}) {
  const url = product.images[0]?.url;

  if (!url || !isCloudinaryImage(url)) {
    return undefined;
  }

  return [360, 540, 720, 960, 1280]
    .map((width) => `${cloudinaryPreview(url, width)} ${width}w`)
    .join(", ");
}

/** Telegram Direct Link: opens Mini App straight on the product. */
export function getProductDeepLink(productId: string): string {
  const bot =
    import.meta.env.VITE_BOT_USERNAME?.replace(/^@/, "").trim() || "swa6ybot";
  const app = import.meta.env.VITE_MINI_APP_SHORT_NAME?.trim() || "swa6";

  return `https://t.me/${bot}/${app}?startapp=${encodeURIComponent(productId)}`;
}
