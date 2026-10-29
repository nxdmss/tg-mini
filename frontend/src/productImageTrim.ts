/**
 * Remove transparent/flat-color padding from product images.
 * Unlike CSS zoom, this keeps every visible part of the garment.
 *
 * Remote images can be analyzed only when their host allows CORS. When it
 * doesn't, the original image remains visible and is never replaced.
 */
type Bounds = { left: number; top: number; right: number; bottom: number };

const MAX_SAMPLE_SIDE = 512;
const MAX_OUTPUT_SIDE = 1800;
const IMAGE_PADDING = 0.055;
const trimmedUrls = new Map<string, Promise<string | null>>();

function findProductBounds(canvas: HTMLCanvasElement): Bounds | null {
  const { width, height } = canvas;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const pixels = context.getImageData(0, 0, width, height).data;
  const pixel = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
  };

  const corners = [
    pixel(0, 0), pixel(width - 1, 0),
    pixel(0, height - 1), pixel(width - 1, height - 1),
  ];

  const transparent = corners.filter((p) => p[3] < 48).length >= 3;
  const background = [0, 1, 2].map(
    (channel) => corners.reduce((sum, p) => sum + p[channel], 0) / 4,
  );

  if (!transparent) {
    // Never try to trim a photograph with a varied/colored background.
    const cornersAgree = corners.every((p) =>
      Math.max(...background.map((value, channel) => Math.abs(p[channel] - value))) < 22,
    );
    const bright = background.every((value) => value > 202);
    if (!cornersAgree || !bright) return null;
  }

  const foreground = (i: number) => {
    const alpha = pixels[i + 3];
    if (transparent) return alpha > 25;

    const r = Math.abs(pixels[i] - background[0]);
    const g = Math.abs(pixels[i + 1] - background[1]);
    const b = Math.abs(pixels[i + 2] - background[2]);
    // Pale clothes need a lower threshold than dark clothes.
    return Math.max(r, g, b) > 22 || r + g + b > 46;
  };

  const rows = new Uint32Array(height);
  const columns = new Uint32Array(width);
  let total = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!foreground((y * width + x) * 4)) continue;
      rows[y] += 1;
      columns[x] += 1;
      total += 1;
    }
  }

  if (total < width * height * 0.008) return null;

  const quantile = (counts: Uint32Array, fraction: number) => {
    let sum = 0;
    const target = total * fraction;
    for (let i = 0; i < counts.length; i += 1) {
      sum += counts[i];
      if (sum >= target) return i;
    }
    return counts.length - 1;
  };

  let left = quantile(columns, 0.003);
  let right = quantile(columns, 0.997) + 1;
  let top = quantile(rows, 0.003);
  let bottom = quantile(rows, 0.997) + 1;

  const visibleWidth = right - left;
  const visibleHeight = bottom - top;
  // A detected logo or texture alone must never be mistaken for the garment.
  if (visibleWidth < width * 0.24 || visibleHeight < height * 0.24) return null;

  const padX = Math.ceil(visibleWidth * IMAGE_PADDING);
  const padY = Math.ceil(visibleHeight * IMAGE_PADDING);
  left = Math.max(0, left - padX);
  right = Math.min(width, right + padX);
  top = Math.max(0, top - padY);
  bottom = Math.min(height, bottom + padY);

  if ((right - left) > width * 0.93 && (bottom - top) > height * 0.93) return null;
  return { left, top, right, bottom };
}

function createCanvasFromImage(
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
): HTMLCanvasElement {
  const ratio = Math.min(1, MAX_SAMPLE_SIDE / Math.max(naturalWidth, naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(naturalHeight * ratio));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function croppedBlob(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Blob | null> {
  const sample = createCanvasFromImage(image, sourceWidth, sourceHeight);
  const bounds = findProductBounds(sample);
  if (!bounds) return null;

  const scaleX = sourceWidth / sample.width;
  const scaleY = sourceHeight / sample.height;
  const sx = Math.max(0, Math.floor(bounds.left * scaleX));
  const sy = Math.max(0, Math.floor(bounds.top * scaleY));
  const sw = Math.min(sourceWidth - sx, Math.ceil((bounds.right - bounds.left) * scaleX));
  const sh = Math.min(sourceHeight - sy, Math.ceil((bounds.bottom - bounds.top) * scaleY));
  const ratio = Math.min(1, MAX_OUTPUT_SIDE / Math.max(sw, sh));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * ratio));
  canvas.height = Math.max(1, Math.round(sh * ratio));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.94));
}

/** Tightens a newly uploaded file without changing the visible garment. */
export async function trimProductImageFile(file: File): Promise<File> {
  if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) return file;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const blob = await croppedBlob(bitmap, bitmap.width, bitmap.height);
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "product";
    return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

/**
 * Tightens already hosted images in the browser, without changing the database.
 * Cross-origin images require Access-Control-Allow-Origin from the image host.
 */
export function getTrimmedProductImageUrl(source: string): Promise<string | null> {
  const existing = trimmedUrls.get(source);
  if (existing) return existing;

  const promise = new Promise<string | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      try {
        const blob = await croppedBlob(image, image.naturalWidth, image.naturalHeight);
        resolve(blob ? URL.createObjectURL(blob) : null);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
  trimmedUrls.set(source, promise);
  return promise;
}
