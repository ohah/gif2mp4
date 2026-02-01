# 예시

브라우저에서 GIF를 MP4로 변환하는 최소 예시입니다.

## 1. WASM 디코더 초기화

```ts
import { initDecode, gifToMp4 } from '@gif2mp4/core';

// pkg-decode WASM 로드 후
const decodePkg = '/pkg-decode-v5';
const decodeMod = await import(/* @vite-ignore */ `${decodePkg}/gif2mp4_decode.js`);
const instance = await decodeMod.default({ module_or_path: `${decodePkg}/gif2mp4_decode_bg.wasm` });
initDecode({ ...instance, decode_gif: decodeMod.decode_gif });
```

## 2. GIF → MP4 변환

```ts
const gifBuffer = new Uint8Array(await file.arrayBuffer());
const mp4Bytes = await gifToMp4(gifBuffer);
const blob = new Blob([mp4Bytes], { type: 'video/mp4' });
const url = URL.createObjectURL(blob);
// <video src={url} /> 또는 <a href={url} download="out.mp4">다운로드</a>
```

## 3. 예제 앱 실행

```bash
bun run build:wasm
bun run dev
```

브라우저에서 `http://localhost:5173` 접속 후 GIF 파일을 선택하면 MP4로 변환·재생·다운로드할 수 있습니다.
