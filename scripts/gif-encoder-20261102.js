// A small animated GIF writer: one global palette, LZW-compressed frames, endless loop. No packages needed.

function lzw(indices, minCodeSize) {
  const clear = 1 << minCodeSize, end = clear + 1;
  const bytes = [];
  let size = minCodeSize + 1, next = end + 1, bits = 0, bitCount = 0;
  const dict = new Map();
  const maxCode = () => size === 12 ? 4096 : (1 << size) - 1;
  const emit = code => {
    bits |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) { bytes.push(bits & 0xff); bits >>>= 8; bitCount -= 8; }
  };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 256 + k;
    const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    // The decoder lags one entry behind, so widen codes only once the next entry would not fit.
    if (next > maxCode() && size < 12) size++;
    if (next < 4096) dict.set(key, next++);
    else { emit(clear); dict.clear(); size = minCodeSize + 1; next = end + 1; }
    prefix = k;
  }
  emit(prefix);
  if (next > maxCode() && size < 12) size++;
  emit(end);
  if (bitCount > 0) bytes.push(bits & 0xff);
  return bytes;
}

// palette: [[r,g,b], ...] up to 256; frames: Uint8Array of palette indices, width*height each; delay in 1/100 s.
export function encodeGif(width, height, palette, frames, delay) {
  let depth = 1;
  while ((1 << depth) < palette.length) depth++;
  const minCodeSize = Math.max(2, depth);
  const out = [...Buffer.from('GIF89a')];
  const u16 = n => out.push(n & 0xff, n >> 8);
  u16(width); u16(height);
  out.push(0xf0 | (depth - 1), 0, 0);
  for (let i = 0; i < 1 << depth; i++) out.push(...(palette[i] ?? [0, 0, 0]));
  // Netscape loop block: repeat forever.
  out.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0'), 0x03, 0x01, 0, 0, 0);
  for (const frame of frames) {
    out.push(0x21, 0xf9, 0x04, 0x00); u16(delay); out.push(0, 0);
    out.push(0x2c); u16(0); u16(0); u16(width); u16(height); out.push(0);
    out.push(minCodeSize);
    const data = lzw(frame, minCodeSize);
    for (let i = 0; i < data.length; i += 255) {
      const block = data.slice(i, i + 255);
      out.push(block.length, ...block);
    }
    out.push(0);
  }
  out.push(0x3b);
  return Buffer.from(out);
}
