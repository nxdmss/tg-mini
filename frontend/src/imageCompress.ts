import { trimProductImageFile } from "./productImageTrim";

const MAX_SIDE = 1400;
const JPEG_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 320_000;

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  // Preserve original PNG transparency.
  if (file.type === "image/png") {
    return file;
  }

  if (file.size <= SKIP_BELOW_BYTES) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);

    const longestSide = Math.max(
      bitmap.width,
      bitmap.height,
    );

    const scale = Math.min(
      1,
      MAX_SIDE / longestSide,
    );

    if (
      scale >= 1 &&
      file.size <= SKIP_BELOW_BYTES * 2
    ) {
      return file;
    }

    const width = Math.max(
      1,
      Math.round(bitmap.width * scale),
    );

    const height = Math.max(
      1,
      Math.round(bitmap.height * scale),
    );

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return file;
    }

    ctx.drawImage(
      bitmap,
      0,
      0,
      width,
      height,
    );

    const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>(
      (resolve) => canvas.toBlob(resolve, outputType, JPEG_QUALITY),
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName =
      file.name.replace(/\.[^.]+$/, "") ||
      "photo";

    return new File(
      [blob],
      `${baseName}.${outputType === "image/webp" ? "webp" : "jpg"}`,
      {
        type: outputType,
        lastModified: Date.now(),
      },
    );
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

export async function compressImageFiles(files: File[]) {
  return Promise.all(
    files.map(async (file) => compressImageFile(await trimProductImageFile(file))),
  );
}