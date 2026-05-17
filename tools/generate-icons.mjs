import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(size, maskable = false) {
  const rows = [];
  const radius = maskable ? size * 0.32 : size * 0.22;
  const center = size / 2;
  for (let y = 0; y < size; y += 1) {
    const row = [0];
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCore = dist < radius;
      const inRing = Math.abs(dist - radius) < size * 0.035;
      const stripe = Math.abs(x - y) < size * 0.025;
      const color = inCore ? [29, 78, 216, 255] : inRing || stripe ? [234, 88, 12, 255] : [12, 14, 18, 255];
      row.push(...color);
    }
    rows.push(Buffer.from(row));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync("assets/icons/icon-192.png", png(192));
writeFileSync("assets/icons/icon-512.png", png(512));
writeFileSync("assets/icons/icon-512-maskable.png", png(512, true));
