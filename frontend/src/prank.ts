import type { Product } from "./types";

const PRANK_PRODUCT_ID =
  "cmt4woma6000bm4koxf35p5xg";

export const PRANK_CAT_VIDEO_SRC =
  "/prank/cat.mp4";

export const PRANK_LAUGH_AUDIO_SRC =
  "/prank/prank-laugh.mp3";

export const PRANK_BOOM_GIF_SRC =
  "/prank/boom.gif";

export const PRANK_BOOM_AUDIO_SRC =
  "/prank/boom.mp3";

let laughAudio:
  HTMLAudioElement | null = null;

let boomAudio:
  HTMLAudioElement | null = null;

let preloadVideo:
  HTMLVideoElement | null = null;

let preloadBoom:
  HTMLImageElement | null = null;

let preloadStarted = false;

export function isPrankProduct(
  product:
    | Product
    | null
    | undefined,
) {
  return (
    product?.id ===
    PRANK_PRODUCT_ID
  );
}

function getLaughAudio() {
  if (!laughAudio) {
    laughAudio =
      new Audio(
        PRANK_LAUGH_AUDIO_SRC,
      );

    laughAudio.preload =
      "auto";
  }

  return laughAudio;
}

function getBoomAudio() {
  if (!boomAudio) {
    boomAudio =
      new Audio(
        PRANK_BOOM_AUDIO_SRC,
      );

    boomAudio.preload =
      "auto";
  }

  return boomAudio;
}

export function preloadPrankAssets() {
  if (preloadStarted) {
    return;
  }

  preloadStarted = true;

  preloadVideo =
    document.createElement(
      "video",
    );

  preloadVideo.preload =
    "auto";

  preloadVideo.muted =
    true;

  preloadVideo.playsInline =
    true;

  preloadVideo.src =
    PRANK_CAT_VIDEO_SRC;

  preloadVideo.load();

  preloadBoom =
    new Image();

  preloadBoom.src =
    PRANK_BOOM_GIF_SRC;

  getLaughAudio().load();
  getBoomAudio().load();
}

export function isPrankLaughPlaying() {
  if (!laughAudio) {
    return false;
  }

  return (
    !laughAudio.paused &&
    !laughAudio.ended
  );
}

export async function playPrankLaugh() {
  const laugh =
    getLaughAudio();

  const boom =
    getBoomAudio();

  boom.pause();
  boom.currentTime = 0;

  laugh.pause();
  laugh.currentTime = 0;

  try {
    await laugh.play();
  } catch {
    // autoplay may be blocked
  }
}

export async function playPrankBoom() {
  const boom =
    getBoomAudio();

  boom.pause();
  boom.currentTime = 0;

  try {
    await boom.play();
  } catch {
    // ignore
  }
}

export function onPrankLaughEnded(
  callback: () => void,
) {
  const laugh =
    getLaughAudio();

  laugh.addEventListener(
    "ended",
    callback,
  );

  return () => {
    laugh.removeEventListener(
      "ended",
      callback,
    );
  };
}

export function stopPrankAudio() {
  if (laughAudio) {
    laughAudio.pause();
    laughAudio.currentTime = 0;
  }

  if (boomAudio) {
    boomAudio.pause();
    boomAudio.currentTime = 0;
  }
}