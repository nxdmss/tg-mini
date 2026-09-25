import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.argv[2] || "public/river.gif");
const data = readFileSync(path);
const header = data.toString("ascii", 0, 6);

if (header !== "GIF87a" && header !== "GIF89a") {
  console.error(`${path}: файл не является GIF (найден ${header}).`);
  process.exit(1);
}

let offset = 13;
const globalTable = data[10];
if (globalTable & 0x80) offset += 3 * 2 ** ((globalTable & 7) + 1);

function skipBlocks() {
  while (offset < data.length) {
    const length = data[offset++];
    if (length === 0) return;
    offset += length;
  }
  throw new Error("Неполный GIF: обрезан блок данных.");
}

let frames = 0;
while (offset < data.length) {
  const marker = data[offset++];
  if (marker === 0x3b) break;
  if (marker === 0x21) {
    offset++; // extension label
    skipBlocks();
  } else if (marker === 0x2c) {
    const localTable = data[offset + 8];
    offset += 9;
    if (localTable & 0x80) offset += 3 * 2 ** ((localTable & 7) + 1);
    offset++; // LZW code size
    skipBlocks();
    frames++;
  } else {
    throw new Error(`Повреждённый GIF: неизвестный блок ${marker}.`);
  }
}

if (frames < 2) {
  console.error(`${path}: только ${frames} кадр. Замени файл настоящей анимированной GIF.`);
  process.exit(1);
}

console.log(`${path}: ${frames} кадров — GIF анимированная.`);
