# GIF → MP4

Bun 모노레포 + Rust 워크스페이스. 파이프라인: **gif(Rust WASM) → video(WebCodecs) → mp4(mp4-muxer, TS)**.

## 구조

```
gif2mp4/
├── package.json          # Bun workspaces
├── Cargo.toml            # Rust workspace (crates/*)
├── crates/
│   ├── gif2mp4-decode/   # WASM: GIF → 프레임 (RGBA + delay)
│   └── gif2mp4-mux/      # WASM: H.264 청크 → MP4
├── packages/
│   └── core/             # TS: decode + WebCodecs encode + mux, gifToMp4()
├── apps/
│   └── web/              # 예제 사이트 (Vite + React)
└── scripts/
    └── copy-wasm.js      # WASM 빌드 결과를 apps/web/public 로 복사
```

## 요구사항

- [Bun](https://bun.sh)
- [Rust](https://rustup.rs) + `wasm32-unknown-unknown`:  
  `rustup target add wasm32-unknown-unknown`
- [wasm-pack](https://rustwasm.github.io/wasm-pack/):  
  `cargo install wasm-pack`

### mise 사용 시

```bash
mise install          # node, bun, rust 설치
mise exec -- rustup target add wasm32-unknown-unknown
mise run install-wasm-pack   # wasm-pack 설치 (한 번만)
```

이후 `mise run build-wasm`, `mise run dev` 등으로 실행 가능.

## 빌드 및 실행

```bash
# 의존성
bun install

# WASM 빌드 (decode + mux) 후 apps/web/public 로 복사
bun run build:wasm

# 예제 사이트 개발 서버
bun run dev
```

브라우저에서 **WASM 로드** → **GIF 선택** → MP4 변환 및 재생/다운로드.

## 스크립트

| 스크립트                    | 설명                                  |
| --------------------------- | ------------------------------------- |
| `bun run build:wasm`        | decode/mux WASM 빌드 + copy-wasm      |
| `bun run build:wasm:decode` | gif2mp4-decode만 빌드                 |
| `bun run build:wasm:mux`    | gif2mp4-mux만 빌드                    |
| `bun run copy-wasm`         | pkg-decode, pkg-mux → apps/web/public |
| `bun run dev`               | apps/web 개발 서버                    |
| `bun run preview`           | apps/web 프리뷰                       |

### mise 사용 시

| 태스크                       | 설명                  |
| ---------------------------- | --------------------- |
| `mise run build-wasm`        | WASM 빌드 + 복사      |
| `mise run install-wasm-pack` | wasm-pack 설치        |
| `mise run dev`               | 예제 사이트 개발 서버 |
| `mise run preview`           | 예제 사이트 프리뷰    |

## 사용 (코드)

```ts
import { initDecode, gifToMp4 } from '@gif2mp4/core';

// WASM 디코더 초기화 후
initDecode(decodeModule);

const mp4Bytes = await gifToMp4(gifBuffer);
```
