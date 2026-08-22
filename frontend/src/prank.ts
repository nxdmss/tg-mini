import type { Product } from "./types";

export const PRANK_MARKER = "__PRANK_CAT__";

const PRANK_AUDIO_SRC = "/prank/prank-laugh.mp3";

let prankAudio: HTMLAudioElement | null = null;

export function isPrankProduct(
  product: Product | null | undefined,
) {
  return product?.description?.trim() === PRANK_MARKER;
}

function getPrankAudio() {
  if (!prankAudio) {
    prankAudio = new Audio(PRANK_AUDIO_SRC);
    prankAudio.preload = "auto";
  }

  return prankAudio;
}

export async function playPrankSound() {
  const audio = getPrankAudio();

  audio.pause();
  audio.currentTime = 0;

  try {
    await audio.play();
  } catch {
    // Some browsers can block autoplay when there was no direct user tap.
  }
}

export function stopPrankSound() {
  if (!prankAudio) {
    return;
  }

  prankAudio.pause();
  prankAudio.currentTime = 0;
}
