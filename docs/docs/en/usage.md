# Usage

## Using in code

`@gif2mp4/core` only needs the **decode WASM** to be injected. Muxing is handled internally with mp4-muxer (pure TS).

```ts
import { initDecode, gifToMp4 } from '@gif2mp4/core';

// After loading the decode WASM module
initDecode(decodeModule);

const mp4Bytes = await gifToMp4(gifBuffer);
```

## WASM init (web)

```ts
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
const decodePkg = `${base}/pkg-decode-v5`;
const decodeMod = await import(/* @vite-ignore */ `${decodePkg}/gif2mp4_decode.js`);
const decodeInit = decodeMod?.default;
const decodeUrl = `${decodePkg}/gif2mp4_decode_bg.wasm`;
const decodeInstance = await decodeInit({ module_or_path: decodeUrl });
initDecode({ ...decodeInstance, decode_gif: decodeMod.decode_gif });
```

## Options

```ts
const mp4Bytes = await gifToMp4(gifBuffer, {
  framerate: 30, // target fps (default: inferred from GIF)
  bitrate: 1_000_000, // H.264 bitrate (bps)
});
```

## Decode only

When you only need frames:

```ts
import { initDecode, decodeGifToFrames } from '@gif2mp4/core';

initDecode(decodeModule);
const { frames, width, height, widthEnc, heightEnc, framerate } = decodeGifToFrames(gifBuffer);
// frames: { data, width, height, delay_centisecs }[]
```
