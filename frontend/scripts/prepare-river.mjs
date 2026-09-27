import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  resolve,
} from "node:path";

const ROOT =
  process.cwd();

const PUBLIC_DIR =
  resolve(ROOT, "public");

const LOCAL_SOURCE =
  resolve(
    PUBLIC_DIR,
    "river.gif",
  );

const OUTPUT =
  resolve(
    PUBLIC_DIR,
    "river-slow.gif",
  );

const REMOTE_SOURCE =
  "https://giffiles.alphacoders.com/223/223620.gif";

/*
 * 1.18 = only a little slower.
 * We modify frame delay metadata directly, so the original
 * picture quality is untouched.
 */
const SPEED_FACTOR = 1.18;

function countImageFrames(
  bytes,
) {
  let frames = 0;

  for (
    let index = 0;
    index < bytes.length;
    index += 1
  ) {
    if (
      bytes[index] === 0x2c
    ) {
      frames += 1;
    }
  }

  return frames;
}

function slowGif(
  source,
) {
  const output =
    Buffer.from(source);

  let changed = 0;

  for (
    let index = 0;
    index <= output.length - 8;
    index += 1
  ) {
    /*
     * Graphic Control Extension:
     * 21 F9 04 [packed] [delay lo] [delay hi] [transparent] 00
     */
    if (
      output[index] !== 0x21 ||
      output[index + 1] !== 0xf9 ||
      output[index + 2] !== 0x04
    ) {
      continue;
    }

    const delay =
      output[index + 4] |
      (output[index + 5] << 8);

    if (
      delay <= 0
    ) {
      continue;
    }

    const slowed =
      Math.min(
        65535,
        Math.max(
          1,
          Math.round(
            delay *
              SPEED_FACTOR,
          ),
        ),
      );

    output[index + 4] =
      slowed & 0xff;

    output[index + 5] =
      (slowed >> 8) &
      0xff;

    changed += 1;

    index += 7;
  }

  return {
    output,
    changed,
  };
}

async function getSourceGif() {
  try {
    const local =
      await readFile(
        LOCAL_SOURCE,
      );

    /*
     * Current river.gif in the repo may be a one-frame preview.
     * Only use it when it actually contains animation.
     */
    if (
      local.length >
        500_000 &&
      countImageFrames(
        local,
      ) > 2
    ) {
      return local;
    }
  } catch {
    // No usable local animated source.
  }

  const response =
    await fetch(
      REMOTE_SOURCE,
      {
        redirect:
          "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0",
          accept:
            "image/gif,image/*;q=0.8,*/*;q=0.5",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `river download failed: ${response.status}`,
    );
  }

  const bytes =
    Buffer.from(
      await response.arrayBuffer(),
    );

  if (
    bytes.length <
      500_000 ||
    bytes.subarray(
      0,
      3,
    ).toString(
      "ascii",
    ) !== "GIF"
  ) {
    throw new Error(
      "downloaded river asset is not the animated GIF",
    );
  }

  return bytes;
}

async function main() {
  await mkdir(
    dirname(OUTPUT),
    {
      recursive: true,
    },
  );

  try {
    const source =
      await getSourceGif();

    const {
      output,
      changed,
    } = slowGif(
      source,
    );

    if (
      changed < 2
    ) {
      throw new Error(
        "animated GIF frame delays were not found",
      );
    }

    await writeFile(
      OUTPUT,
      output,
    );

    console.log(
      `[river] prepared ${changed} slowed frames -> public/river-slow.gif`,
    );
  } catch (error) {
    /*
     * Do not make Vercel build fail because of the background.
     * The React component has the remote animated GIF fallback.
     */
    console.warn(
      "[river] could not prepare slowed local GIF:",
      error instanceof Error
        ? error.message
        : error,
    );
  }
}

await main();
