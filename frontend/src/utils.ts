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
