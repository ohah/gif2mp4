/**
 * GIF → MP4 using:
 * - decode: Rust WASM (gif2mp4-decode)
 * - encode: WebCodecs VideoEncoder (native/HW)
<<<<<<< HEAD
 * - mux: mp4-muxer 라이브러리
=======
 * - mux: mp4-muxer (pure TS)
>>>>>>> parent of ef709fe (refactor: mp4-muxer 제거, 내부 Rust WASM 뮤스(gif2mp4-mux) 사용)
 */
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

async function muxWithMp4Muxer(
  encoded: Awaited<ReturnType<typeof encodeToChunks>>
): Promise<Uint8Array> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: encoded.widthEnc,
      height: encoded.heightEnc,
      frameRate: Math.max(1, Math.round(encoded.framerate)),
    } as { codec: 'avc'; width: number; height: number },
    fastStart: 'in-memory',
  } as ConstructorParameters<typeof Muxer>[0]);
  const fr = encoded.framerate;
  const chunks = encoded.chunks;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]!;
    const durationUs =
      i + 1 < chunks.length ? chunks[i + 1]!.timestamp - c.timestamp : Math.round(1_000_000 / fr);
    const chunk = new EncodedVideoChunk({
      type: c.keyFrame ? 'key' : 'delta',
      timestamp: c.timestamp,
      duration: durationUs,
      data: c.data,
    });
    (muxer as { addVideoChunk: (chunk: EncodedVideoChunk, meta?: unknown) => void }).addVideoChunk(
      chunk
    );
  }
  muxer.finalize();
  return new Uint8Array((muxer.target as { buffer: ArrayBuffer }).buffer);
}

export interface GifToMp4Options {
  /** Target framerate for output (default: derived from GIF delays) */
  framerate?: number;
  /** H.264 bitrate in bps (default: 1_000_000) */
  bitrate?: number;
}

export interface DecodeModule {
  decode_gif(gif_bytes: Uint8Array): DecodeResult;
}

export interface DecodeResult {
  buffer: Uint8Array;
  frames: FrameMeta[];
}

export interface FrameMeta {
  offset: number;
  length: number;
  width: number;
  height: number;
  delay_centisecs: number;
}

export interface GifFrame {
  width: number;
  height: number;
  delay_centisecs: number;
  data: Uint8Array;
}

export interface DecodedGif {
  frames: GifFrame[];
  width: number;
  height: number;
  widthEnc: number;
  heightEnc: number;
  framerate: number;
}

/**
 * Decode GIF to frames (RGBA). Requires initDecode() to have been called.
 * Use with gifToMp4() or encodeAndMuxToMp4() for browser-playable MP4.
 */
export function decodeGifToFrames(gifBuffer: ArrayBuffer | Uint8Array): DecodedGif {
  const decodeMod = getDecodeModule();
  if (!decodeMod) {
    throw new Error('Call initDecode(decodeModule) with WASM init first.');
  }

  const bytes = gifBuffer instanceof Uint8Array ? gifBuffer : new Uint8Array(gifBuffer);
  const result = decodeMod.decode_gif(bytes);
  const { frames, widthEnc, heightEnc, framerate } = parseDecodeResult(result);
  return {
    frames,
    width: frames[0].width,
    height: frames[0].height,
    widthEnc,
    heightEnc,
    framerate,
  };
}

function parseDecodeResult(result: unknown): {
  frames: GifFrame[];
  widthEnc: number;
  heightEnc: number;
  framerate: number;
} {
  // decode_gif returns DecodeResult (wasm_bindgen struct with .buffer and .frames getters) or plain { buffer, frames }.
  if (result == null || typeof result !== 'object') {
    throw new Error(
      `Decode failed: decode_gif must return an object with buffer and frames. Got: ${result == null ? 'null' : typeof result}.`
    );
  }
  const raw = result as unknown as Record<string, unknown>;
  const plainBuf = raw.buffer ?? raw['buffer'];
  const plainFrames = raw.frames ?? raw['frames'];

  if (plainBuf == null) {
    throw new Error(
      'Decode failed: result.buffer is missing. Ensure gif2mp4-decode decode_gif returns DecodeResult or { buffer, frames }.'
    );
  }
  if (plainFrames == null || !Array.isArray(plainFrames)) {
    throw new Error(
      'Decode failed: result.frames is missing or not an array. Ensure gif2mp4-decode decode_gif returns DecodeResult or { buffer, frames }.'
    );
  }

  let buffer: Uint8Array;
  if (plainBuf instanceof Uint8Array) {
    buffer = plainBuf;
  } else if (Array.isArray(plainBuf)) {
    buffer = new Uint8Array(plainBuf);
  } else if (typeof (plainBuf as ArrayBufferView).byteLength === 'number') {
    const view = plainBuf as ArrayBufferView;
    buffer = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  } else {
    throw new Error(
      `Decode failed: result.buffer must be Uint8Array or array of numbers. Got: ${typeof plainBuf}.`
    );
  }

  const metas: FrameMeta[] = plainFrames.map((m: Record<string, unknown>, i: number) => {
    const o = m?.offset ?? m?.['offset'];
    const len = m?.length ?? m?.['length'];
    const w = m?.width ?? m?.['width'];
    const h = m?.height ?? m?.['height'];
    const d = m?.delay_centisecs ?? m?.['delay_centisecs'];
    if (o == null || len == null || w == null || h == null || d == null) {
      throw new Error(
        `Decode failed: frames[${i}] must have offset, length, width, height, delay_centisecs. Got: ${JSON.stringify(m)}.`
      );
    }
    return {
      offset: Number(o),
      length: Number(len),
      width: Number(w),
      height: Number(h),
      delay_centisecs: Number(d),
    };
  });

  if (buffer.byteLength === 0) throw new Error('Decode failed: buffer is empty.');
  if (metas.length === 0) throw new Error('Decode failed: GIF has no frames.');

  const frames: GifFrame[] = metas.map((m) => ({
    width: m.width,
    height: m.height,
    delay_centisecs: m.delay_centisecs,
    data: buffer.subarray(m.offset, m.offset + m.length),
  }));

  const width = frames[0].width;
  const height = frames[0].height;
  // WebCodecs H.264 인코더: 브라우저 구현이 짝수 width/height만 허용 ("H264 only supports even sized frames")
  let widthEnc = width & 1 ? width + 1 : width;
  let heightEnc = height & 1 ? height + 1 : height;
  // AVC Level 3.0(avc1.42E01E) 최대 프레임 픽셀 수. 초과 시 인코더가 거부하므로 비율 유지해 축소.
  const AVC_LEVEL_30_MAX_PIXELS = 414_720;
  const safeMaxPixels = Math.floor(AVC_LEVEL_30_MAX_PIXELS * 0.9);
  if (widthEnc * heightEnc > safeMaxPixels) {
    const scale = Math.sqrt(safeMaxPixels / (widthEnc * heightEnc));
    widthEnc = Math.max(2, Math.floor(widthEnc * scale) & ~1);
    heightEnc = Math.max(2, Math.floor(heightEnc * scale) & ~1);
  }
  const framerate = inferFramerate(frames);
  return { frames, widthEnc, heightEnc, framerate };
}

/**
 * Convert GIF buffer to MP4 buffer.
 * Requires initDecode() to have been called with WASM module.
 * 인코드·뮤스는 WebCodecs + mp4-muxer.
 */
export async function gifToMp4(
  gifBuffer: ArrayBuffer | Uint8Array,
  options: GifToMp4Options = {}
): Promise<Uint8Array> {
  const decoded = decodeGifToFrames(gifBuffer);
  return encodeAndMuxToMp4(decoded, options);
}

/**
 * 이미 디코딩된 GIF(DecodedGif)를 MP4로 인코드·뮤스만 수행.
 * 디코더 비교 벤치마크 시 동일 인코드/뮤스 파이프라인을 쓰기 위해 사용.
 */
export async function encodeAndMuxToMp4(
  decoded: DecodedGif,
  options: GifToMp4Options = {}
): Promise<Uint8Array> {
  const encoded = await encodeToChunks(decoded, options);
  return muxWithMp4Muxer(encoded);
}

/** 인코드만 수행해 청크 반환. */
export async function encodeToChunks(
  decoded: DecodedGif,
  options: GifToMp4Options = {}
): Promise<{
  chunks: { data: Uint8Array; timestamp: number; keyFrame: boolean }[];
  widthEnc: number;
  heightEnc: number;
  framerate: number;
  description: ArrayBuffer | undefined;
}> {
  const { frames, width, height, widthEnc, heightEnc, framerate } = decoded;
  const bitrate = options.bitrate ?? 1_000_000;
  const framerateOpt = options.framerate ?? framerate;
  return encodeWithWebCodecsToChunks(
    frames,
    width,
    height,
    widthEnc,
    heightEnc,
    framerateOpt,
    bitrate
  );
}

let decodeModule: DecodeModule | null = null;

export function initDecode(mod: DecodeModule): void {
  decodeModule = mod;
}

function getDecodeModule(): DecodeModule | null {
  return decodeModule;
}

function inferFramerate(frames: GifFrame[]): number {
  if (frames.length === 0) return 30;
  const totalCentisecs = frames.reduce((s, f) => s + f.delay_centisecs, 0);
  if (totalCentisecs <= 0) return 30;
  const totalSecs = totalCentisecs / 100;
  return frames.length / totalSecs;
}

async function encodeWithWebCodecsToChunks(
  frames: GifFrame[],
  width: number,
  height: number,
  widthEnc: number,
  heightEnc: number,
  framerate: number,
  bitrate: number
<<<<<<< HEAD
): Promise<{
  chunks: { data: Uint8Array; timestamp: number; keyFrame: boolean }[];
  widthEnc: number;
  heightEnc: number;
  framerate: number;
  description: ArrayBuffer | undefined;
}> {
  const chunks: { data: Uint8Array; timestamp: number; keyFrame: boolean }[] = [];
  let description: ArrayBuffer | undefined;
  let rejectEncoder: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunks.push({
        data,
        timestamp: chunk.timestamp ?? 0,
        keyFrame: chunk.type === 'key',
      });
      const desc = (chunk as EncodedVideoChunk & { decoderConfig?: { description?: ArrayBuffer } })
        .decoderConfig?.description;
      if (description == null && desc) {
        description = desc;
      }
    },
=======
): Promise<Uint8Array> {
  const target = new ArrayBufferTarget();
  const frameRateInt = Math.max(1, Math.round(framerate));
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: widthEnc, height: heightEnc, frameRate: frameRateInt },
    fastStart: 'in-memory',
  });

  let rejectEncoder: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata ?? undefined),
>>>>>>> parent of ef709fe (refactor: mp4-muxer 제거, 내부 Rust WASM 뮤스(gif2mp4-mux) 사용)
    error: (e) => {
      rejectEncoder = e;
    },
  });

  const config: VideoEncoderConfig & { avc?: { format?: 'avc' | 'annexb' } } = {
    codec: 'avc1.42E01E',
    width: widthEnc,
    height: heightEnc,
    bitrate,
    framerate,
<<<<<<< HEAD
    hardwareAcceleration: 'prefer-software',
    avc: { format: 'annexb' },
=======
    hardwareAcceleration: 'prefer-hardware',
>>>>>>> parent of ef709fe (refactor: mp4-muxer 제거, 내부 Rust WASM 뮤스(gif2mp4-mux) 사용)
  };
  try {
    encoder.configure(config);
  } catch (e) {
    try {
      encoder.close();
    } catch {
      /* already closed */
    }
    throw e;
  }
  if (rejectEncoder) {
    try {
      encoder.close();
    } catch {
      /* already closed */
    }
    throw rejectEncoder;
  }

  let timestampUs = 0;
  const minDeltaUs = 1_000;
  const canvasOut = new OffscreenCanvas(widthEnc, heightEnc);
  const ctxOut = canvasOut.getContext('2d');
  if (!ctxOut) throw new Error('2d context');

  const needScale = widthEnc < width || heightEnc < height;
  let canvasSrc: OffscreenCanvas | null = needScale ? new OffscreenCanvas(width, height) : null;
  const ctxSrc = canvasSrc?.getContext('2d');

  // VideoFrame(canvas)는 캔버스 참조를 유지함. encode()가 비동기로 처리될 때
  // 다음 putImageData로 캔버스가 덮어써져 동일(마지막) 프레임이 반복 인코딩될 수 있음.
  // 매 프레임마다 createImageBitmap으로 픽셀을 복사한 뒤 VideoFrame(bitmap)으로 전달.
  const bitmapsToClose: ImageBitmap[] = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const delayUs = Math.max(frame.delay_centisecs * 10_000, minDeltaUs);
    const rgba = frame.data;
    let imageData: ImageData;
    if (width === widthEnc && height === heightEnc) {
      imageData = new ImageData(
        new Uint8ClampedArray(rgba.buffer as ArrayBuffer, rgba.byteOffset, rgba.byteLength),
        width,
        height
      );
      ctxOut.putImageData(imageData, 0, 0);
    } else if (needScale && ctxSrc && canvasSrc) {
      imageData = new ImageData(
        new Uint8ClampedArray(rgba.buffer as ArrayBuffer, rgba.byteOffset, rgba.byteLength),
        width,
        height
      );
      ctxSrc.putImageData(imageData, 0, 0);
      ctxOut.drawImage(canvasSrc, 0, 0, width, height, 0, 0, widthEnc, heightEnc);
    } else {
      const padded = new Uint8ClampedArray(widthEnc * heightEnc * 4);
      for (let y = 0; y < height; y++) {
        padded.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * widthEnc * 4);
      }
      imageData = new ImageData(padded, widthEnc, heightEnc);
      ctxOut.putImageData(imageData, 0, 0);
    }
    const bitmap = await createImageBitmap(canvasOut);
    bitmapsToClose.push(bitmap);
    const videoFrame = new VideoFrame(bitmap, {
      timestamp: timestampUs,
      duration: delayUs,
      alpha: 'discard',
    });
    encoder.encode(videoFrame, { keyFrame: i === 0 });
    videoFrame.close();
    timestampUs += delayUs;
  }

  await encoder.flush();
  for (const b of bitmapsToClose) b.close();
  try {
    encoder.close();
  } catch {
    /* already closed on error */
  }
  if (rejectEncoder) throw rejectEncoder;

<<<<<<< HEAD
  return { chunks, widthEnc, heightEnc, framerate, description };
=======
  muxer.finalize();
  return new Uint8Array(target.buffer);
>>>>>>> parent of ef709fe (refactor: mp4-muxer 제거, 내부 Rust WASM 뮤스(gif2mp4-mux) 사용)
}
