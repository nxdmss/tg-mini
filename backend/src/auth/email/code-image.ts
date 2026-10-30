import { deflateSync, inflateSync } from 'node:zlib';
import { DIGIT_MASKS, GLYPH_HEIGHT, GLYPH_WIDTH } from './digit-masks';

// Rasterized brand digits survive Gmail's lack of custom-font support.
const glyphs = inflateSync(Buffer.from(DIGIT_MASKS, 'base64'));
const gap = 16;
const padding = 16;
export const CODE_IMAGE_WIDTH = padding * 2 + GLYPH_WIDTH * 6 + gap * 5;
export const CODE_IMAGE_HEIGHT = GLYPH_HEIGHT + padding * 2;

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

export function renderCodeImage(code: string): Buffer {
  if (!/^\d{6}$/.test(code)) throw new Error('Expected a six-digit email code');
  const stride = CODE_IMAGE_WIDTH + 1;
  const pixels = Buffer.alloc(stride * CODE_IMAGE_HEIGHT, 255);
  for (let y = 0; y < CODE_IMAGE_HEIGHT; y++) pixels[y * stride] = 0;
  for (let index = 0; index < code.length; index++) {
    const glyph = Number(code[index]) * GLYPH_WIDTH * GLYPH_HEIGHT;
    for (let y = 0; y < GLYPH_HEIGHT; y++) {
      const source = glyph + y * GLYPH_WIDTH;
      const target = (y + padding) * stride + 1 + padding + index * (GLYPH_WIDTH + gap);
      glyphs.copy(pixels, target, source, source + GLYPH_WIDTH);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(CODE_IMAGE_WIDTH, 0);
  header.writeUInt32BE(CODE_IMAGE_HEIGHT, 4);
  header[8] = 8; // 8-bit grayscale, opaque white background.
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
