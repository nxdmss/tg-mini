import {
  PrismaClient,
} from "@prisma/client";

import {
  putObject,
} from "./lib/yandex-s3.mjs";

const prisma =
  new PrismaClient();

const dryRun =
  process.env.DRY_RUN ===
  "1";

const sourceHosts = (
  process.env
    .MIGRATE_IMAGE_HOSTS ||
  "res.cloudinary.com"
)
  .split(",")
  .map((value) =>
    value.trim(),
  )
  .filter(Boolean);

const publicBase =
  process.env
    .MEDIA_PUBLIC_BASE_URL
    ?.trim()
    .replace(/\/+$/, "");

function shouldMigrate(
  url,
) {
  if (
    publicBase &&
    url.startsWith(
      publicBase,
    )
  ) {
    return false;
  }

  try {
    const host =
      new URL(url).host;

    return sourceHosts.some(
      (source) =>
        host === source ||
        host.endsWith(
          `.${source}`,
        ),
    );
  } catch {
    return false;
  }
}

function extension(
  contentType,
) {
  const type =
    contentType
      .split(";")[0]
      .trim()
      .toLowerCase();

  return (
    {
      "image/jpeg":
        ".jpg",
      "image/png":
        ".png",
      "image/webp":
        ".webp",
      "image/gif":
        ".gif",
      "image/avif":
        ".avif",
    }[type] ||
    ".bin"
  );
}

async function main() {
  const images =
    await prisma
      .productImage
      .findMany({
        orderBy: {
          id: "asc",
        },
      });

  const targets =
    images.filter(
      (image) =>
        shouldMigrate(
          image.url,
        ),
    );

  console.log(
    `[media] found ${targets.length} image(s) to migrate`,
  );

  let migrated = 0;
  let failed = 0;

  for (
    const image of targets
  ) {
    try {
      console.log(
        `[media] ${image.id}: ${image.url}`,
      );

      if (dryRun) {
        continue;
      }

      const response =
        await fetch(
          image.url,
          {
            redirect:
              "follow",
          },
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `download failed ${response.status}`,
        );
      }

      const contentType =
        response.headers.get(
          "content-type",
        ) ||
        "application/octet-stream";

      const body =
        Buffer.from(
          await response
            .arrayBuffer(),
        );

      const key =
        `products/migrated/${image.id}${extension(
          contentType,
        )}`;

      const nextUrl =
        await putObject({
          key,
          body,
          contentType,
        });

      await prisma
        .productImage
        .update({
          where: {
            id:
              image.id,
          },
          data: {
            url:
              nextUrl,
          },
        });

      migrated += 1;

      console.log(
        `[media] -> ${nextUrl}`,
      );
    } catch (error) {
      failed += 1;

      console.error(
        `[media] FAILED ${image.id}:`,
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  console.log(
    `[media] complete: migrated=${migrated} failed=${failed} dryRun=${dryRun}`,
  );

  if (
    failed > 0
  ) {
    process.exitCode = 1;
  }
}

try {
  await main();
} finally {
  await prisma
    .$disconnect();
}
