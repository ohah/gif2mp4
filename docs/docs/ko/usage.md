# 사용 예시

## 코드에서 사용

`@gif2mp4/core`는 **decode WASM만** 주입하면 됩니다. 뮤스는 mp4-muxer(순수 TS)로 내부 처리됩니다.

```ts
import { initDecode, gifToMp4 } from '@gif2mp4/core';

// WASM 초기화 (decode 모듈 로드 후)
initDecode(decodeModule);

const mp4Bytes = await gifToMp4(gifBuffer);
```

## WASM 초기화 (웹)

```ts
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
const decodePkg = `${base}/pkg-decode-v5`;
const decodeMod = await import(/* @vite-ignore */ `${decodePkg}/gif2mp4_decode.js`);
const decodeInit = decodeMod?.default;
const decodeUrl = `${decodePkg}/gif2mp4_decode_bg.wasm`;
const decodeInstance = await decodeInit({ module_or_path: decodeUrl });
initDecode({ ...decodeInstance, decode_gif: decodeMod.decode_gif });
```

## 옵션

```ts
const mp4Bytes = await gifToMp4(gifBuffer, {
  framerate: 30, // 목표 프레임레이트 (기본: GIF에서 추정)
  bitrate: 1_000_000, // H.264 비트레이트(bps)
});
```

## 디코드만 사용

프레임만 필요할 때:

```ts
import { initDecode, decodeGifToFrames } from '@gif2mp4/core';

initDecode(decodeModule);
const { frames, width, height, widthEnc, heightEnc, framerate } = decodeGifToFrames(gifBuffer);
// frames: { data, width, height, delay_centisecs }[]
```
