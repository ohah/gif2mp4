/**
 * @gif2mp4/core
 * Pipeline: gif(Rust WASM) → video(WebCodecs) → mp4(mp4-muxer)
 */

export type { GifToMp4Options, DecodeResult, DecodedGif, FrameMeta, GifFrame } from './gif-to-mp4';
<<<<<<< HEAD
export {
  gifToMp4,
  decodeGifToFrames,
  encodeAndMuxToMp4,
  encodeToChunks,
  initDecode,
} from './gif-to-mp4';
=======
export { gifToMp4, decodeGifToFrames, encodeAndMuxToMp4, initDecode } from './gif-to-mp4';
>>>>>>> parent of ef709fe (refactor: mp4-muxer 제거, 내부 Rust WASM 뮤스(gif2mp4-mux) 사용)
