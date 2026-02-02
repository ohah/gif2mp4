/**
 * @gif2mp4/core
 * Pipeline: gif(Rust WASM) → video(WebCodecs) → mp4(mp4-muxer)
 */

export type { GifToMp4Options, DecodeResult, DecodedGif, FrameMeta, GifFrame } from './gif-to-mp4';
export {
  gifToMp4,
  decodeGifToFrames,
  encodeAndMuxToMp4,
  encodeToChunks,
  initDecode,
} from './gif-to-mp4';
