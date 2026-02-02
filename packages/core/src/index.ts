/**
 * @gif2mp4/core
 * Pipeline: gif(Rust WASM) → video(WebCodecs) → mp4(Rust WASM mux)
 */

export type { GifToMp4Options, DecodeResult, DecodedGif, FrameMeta, GifFrame } from './gif-to-mp4';
export { gifToMp4, decodeGifToFrames, encodeAndMuxToMp4, initDecode, initMux } from './gif-to-mp4';
