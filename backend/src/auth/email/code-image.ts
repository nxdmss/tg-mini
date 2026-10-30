import { deflateSync, inflateSync } from 'node:zlib';
import { LABEL_CHARS, LABEL_MASKS } from './label-masks';
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
  return encodeImage(pixels, CODE_IMAGE_WIDTH, CODE_IMAGE_HEIGHT);
}

function encodeImage(pixels: Buffer, width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8-bit grayscale, opaque white background.
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

export const EMAIL_IMAGE_WIDTH = 1040;
export const EMAIL_IMAGE_HEIGHT = 720;
const labels = inflateSync(Buffer.from(LABEL_MASKS, 'base64'));

// The complete white canvas is rasterized, so dark-mode clients cannot
// recolor the surrounding label area independently of the brand code.
export function renderEmailImage(code: string, deadline: string): Buffer {
  if (!/^\d{6}$/.test(code) || !/^\d{2}:\d{2}$/.test(deadline)) throw new Error('Invalid email image data');
  const stride = EMAIL_IMAGE_WIDTH + 1;
  const pixels = Buffer.alloc(stride * EMAIL_IMAGE_HEIGHT, 255);
  for (let y = 0; y < EMAIL_IMAGE_HEIGHT; y++) pixels[y * stride] = 0;
  const left = (EMAIL_IMAGE_WIDTH - (GLYPH_WIDTH * 6 + gap * 5)) / 2;
  for (let i = 0; i < code.length; i++) {
    for (let y = 0; y < GLYPH_HEIGHT; y++) {
      const start = (Number(code[i]) * GLYPH_HEIGHT + y) * GLYPH_WIDTH;
      glyphs.copy(pixels, (160 + y) * stride + 1 + left + i * (GLYPH_WIDTH + gap), start, start + GLYPH_WIDTH);
    }
  }
  function line(text: string, top: number) {
    const x = (EMAIL_IMAGE_WIDTH - text.length * 28) / 2;
    for (let i = 0; i < text.length; i++) {
      const index = LABEL_CHARS.indexOf(text[i]);
      if (index < 0) throw new Error('Unsupported email label');
      for (let y = 0; y < 48; y++) {
        const start = (index * 48 + y) * 28;
        labels.copy(pixels, (top + y) * stride + 1 + x + i * 28, start, start + 28);
      }
    }
  }
  line('10 МИНУТ', 430);
  line('ДО ' + deadline + ' МСК', 494);
  return encodeImage(pixels, EMAIL_IMAGE_WIDTH, EMAIL_IMAGE_HEIGHT);
}
