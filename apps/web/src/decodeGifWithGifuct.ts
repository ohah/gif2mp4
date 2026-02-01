/**
 * gifuct-js로 GIF 디코딩 후 core의 DecodedGif 형태로 변환.
 * 벤치마크에서 WASM 디코더와 비교할 때 사용.
 */
import { parseGIF, decompressFrames } from 'gifuct-js';
import type { DecodedGif, GifFrame } from '@gif2mp4/core';

export function decodeGifWithGifuct(gifBuffer: ArrayBuffer | Uint8Array): DecodedGif {
  const buf = gifBuffer instanceof ArrayBuffer ? gifBuffer : gifBuffer.buffer;
  const gif = parseGIF(buf);
  const rawFrames = decompressFrames(gif, true);
  const width = gif.lsd.width;
  const height = gif.lsd.height;

  const frames: GifFrame[] = [];
  const fullStride = width * height * 4;
  let prevRgba: Uint8ClampedArray | null = null;

  for (let i = 0; i < rawFrames.length; i++) {
    const f = rawFrames[i]!;
    const { dims, patch, delay, disposalType } = f;
    const rgba = new Uint8ClampedArray(fullStride);

    if (i === 0) {
      rgba.fill(0);
    } else if (prevRgba) {
      if (disposalType === 2) {
        rgba.fill(0);
      } else {
        rgba.set(prevRgba);
      }
    }

    const patchWidth = dims.width;
    const patchHeight = dims.height;
    const left = dims.left;
    const top = dims.top;
    for (let y = 0; y < patchHeight; y++) {
      const dstOffset = ((top + y) * width + left) * 4;
      const srcOffset = y * patchWidth * 4;
      rgba.set(patch.subarray(srcOffset, srcOffset + patchWidth * 4), dstOffset);
    }
    prevRgba = rgba;

    const delayCentisecs = Math.max(1, Math.round(delay / 10));
    frames.push({
      width,
      height,
      delay_centisecs: delayCentisecs,
      data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength),
    });
  }

  let widthEnc = width & 1 ? width + 1 : width;
  let heightEnc = height & 1 ? height + 1 : height;
  const AVC_LEVEL_30_MAX_PIXELS = 414_720;
  const safeMaxPixels = Math.floor(AVC_LEVEL_30_MAX_PIXELS * 0.9);
  if (widthEnc * heightEnc > safeMaxPixels) {
    const scale = Math.sqrt(safeMaxPixels / (widthEnc * heightEnc));
    widthEnc = Math.max(2, Math.floor(widthEnc * scale) & ~1);
    heightEnc = Math.max(2, Math.floor(heightEnc * scale) & ~1);
  }

  const totalCentisecs = frames.reduce((s, fr) => s + fr.delay_centisecs, 0);
  const framerate = totalCentisecs > 0 ? frames.length / (totalCentisecs / 100) : 30;

  return {
    frames,
    width,
    height,
    widthEnc,
    heightEnc,
    framerate,
  };
}
