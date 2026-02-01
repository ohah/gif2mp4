# Example

Minimal example for converting GIF to MP4 in the browser.

## 1. Init WASM decoder

```ts
import { initDecode, gifToMp4 } from '@gif2mp4/core';

// After loading pkg-decode WASM
const decodePkg = '/pkg-decode-v5';
const decodeMod = await import(/* @vite-ignore */ `${decodePkg}/gif2mp4_decode.js`);
const instance = await decodeMod.default({ module_or_path: `${decodePkg}/gif2mp4_decode_bg.wasm` });
initDecode({ ...instance, decode_gif: decodeMod.decode_gif });
```

## 2. Convert GIF → MP4

```ts
const gifBuffer = new Uint8Array(await file.arrayBuffer());
const mp4Bytes = await gifToMp4(gifBuffer);
const blob = new Blob([mp4Bytes], { type: 'video/mp4' });
const url = URL.createObjectURL(blob);
// <video src={url} /> or <a href={url} download="out.mp4">Download</a>
```

## 3. Run the sample app

```bash
bun run build:wasm
bun run dev
```

Open `http://localhost:5173`, choose a GIF file, and you can convert, play, and download as MP4.
