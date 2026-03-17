import { describe, test, expect } from 'bun:test';
import {
  decodeGifToFrames,
  initDecode,
  type DecodeModule,
  type DecodedGif,
  type GifFrame,
} from './gif-to-mp4';

/**
 * Helper: 최소 1x1 GIF의 디코드 결과를 흉내내는 mock DecodeModule.
 * 실제 WASM 없이 parseDecodeResult / inferFramerate 등 순수 로직을 테스트.
 */
function createMockDecodeModule(
  opts: {
    width?: number;
    height?: number;
    frameCount?: number;
    delayCentisecs?: number;
  } = {}
): DecodeModule {
  const w = opts.width ?? 2;
  const h = opts.height ?? 2;
  const n = opts.frameCount ?? 3;
  const delay = opts.delayCentisecs ?? 10; // 0.1s per frame
  const bytesPerFrame = w * h * 4;
  const buffer = new Uint8Array(bytesPerFrame * n);
  // 프레임별로 고유 색상
  for (let i = 0; i < n; i++) {
    for (let p = 0; p < bytesPerFrame; p += 4) {
      buffer[i * bytesPerFrame + p] = i * 80; // R
      buffer[i * bytesPerFrame + p + 1] = 128;
      buffer[i * bytesPerFrame + p + 2] = 255;
      buffer[i * bytesPerFrame + p + 3] = 255; // A
    }
  }
  const frames = Array.from({ length: n }, (_, i) => ({
    offset: i * bytesPerFrame,
    length: bytesPerFrame,
    width: w,
    height: h,
    delay_centisecs: delay,
  }));
  return {
    decode_gif: () => ({ buffer, frames }),
  };
}

describe('decodeGifToFrames', () => {
  test('initDecode 호출 전에는 에러 발생', () => {
    // reset module state
    initDecode(null as unknown as DecodeModule);
    expect(() => decodeGifToFrames(new Uint8Array(10))).toThrow(
      'Call initDecode'
    );
  });

  test('정상 디코딩 후 프레임 배열과 크기 반환', () => {
    const mock = createMockDecodeModule({ width: 4, height: 4, frameCount: 5, delayCentisecs: 10 });
    initDecode(mock);
    const result = decodeGifToFrames(new Uint8Array(10));

    expect(result.frames).toHaveLength(5);
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expect(result.widthEnc).toBe(4); // even, no change
    expect(result.heightEnc).toBe(4);
    expect(result.framerate).toBeCloseTo(10, 1); // 5 frames / 0.5s = 10fps
  });

  test('홀수 크기는 짝수로 올림', () => {
    const mock = createMockDecodeModule({ width: 3, height: 5, frameCount: 1 });
    initDecode(mock);
    const result = decodeGifToFrames(new Uint8Array(10));

    expect(result.widthEnc).toBe(4); // 3 → 4
    expect(result.heightEnc).toBe(6); // 5 → 6
  });

  test('큰 이미지는 AVC Level 3.0 제한에 맞춰 축소', () => {
    // 1000x1000 = 1,000,000 pixels > AVC Level 3.0 max (414,720 * 0.9 = 373,248)
    const mock = createMockDecodeModule({ width: 1000, height: 1000, frameCount: 1 });
    initDecode(mock);
    const result = decodeGifToFrames(new Uint8Array(10));

    const pixels = result.widthEnc * result.heightEnc;
    expect(pixels).toBeLessThanOrEqual(373_248);
    expect(result.widthEnc % 2).toBe(0); // even
    expect(result.heightEnc % 2).toBe(0); // even
  });

  test('delay가 0이면 기본 30fps', () => {
    const mock = createMockDecodeModule({ frameCount: 3, delayCentisecs: 0 });
    initDecode(mock);
    const result = decodeGifToFrames(new Uint8Array(10));

    expect(result.framerate).toBe(30);
  });

  test('프레임 data가 올바른 subarray를 가리킴', () => {
    const mock = createMockDecodeModule({ width: 2, height: 2, frameCount: 3 });
    initDecode(mock);
    const result = decodeGifToFrames(new Uint8Array(10));

    // 각 프레임의 첫 번째 R 값이 고유해야 함
    const rValues = result.frames.map((f) => f.data[0]);
    expect(new Set(rValues).size).toBe(3);
  });

  test('빈 buffer 반환 시 에러', () => {
    initDecode({
      decode_gif: () => ({ buffer: new Uint8Array(0), frames: [{ offset: 0, length: 0, width: 1, height: 1, delay_centisecs: 10 }] }),
    });
    expect(() => decodeGifToFrames(new Uint8Array(10))).toThrow('buffer is empty');
  });

  test('빈 frames 반환 시 에러', () => {
    initDecode({
      decode_gif: () => ({ buffer: new Uint8Array(16), frames: [] }),
    });
    expect(() => decodeGifToFrames(new Uint8Array(10))).toThrow('no frames');
  });

  test('frames에 필수 필드 누락 시 에러', () => {
    initDecode({
      decode_gif: () => ({
        buffer: new Uint8Array(16),
        frames: [{ offset: 0, length: 16, width: 2 }], // height, delay_centisecs 누락
      }),
    });
    expect(() => decodeGifToFrames(new Uint8Array(10))).toThrow('must have');
  });

  test('result가 null이면 에러', () => {
    initDecode({
      decode_gif: () => null as unknown as ReturnType<DecodeModule['decode_gif']>,
    });
    expect(() => decodeGifToFrames(new Uint8Array(10))).toThrow('must return an object');
  });

  test('ArrayBuffer 입력도 Uint8Array로 변환하여 처리', () => {
    const mock = createMockDecodeModule({ width: 2, height: 2, frameCount: 1 });
    initDecode(mock);
    const buf = new ArrayBuffer(10);
    const result = decodeGifToFrames(buf);
    expect(result.frames).toHaveLength(1);
  });
});
