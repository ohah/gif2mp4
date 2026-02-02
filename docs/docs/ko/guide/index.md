# 시작하기

## 요구사항

- [Bun](https://bun.sh)
- [Rust](https://rustup.rs) + `wasm32-unknown-unknown`:  
  `rustup target add wasm32-unknown-unknown`
- [wasm-pack](https://rustwasm.github.io/wasm-pack/):  
  `cargo install wasm-pack`

### mise 사용 시

```bash
mise install
mise exec -- rustup target add wasm32-unknown-unknown
mise run install-wasm-pack   # 한 번만
```

## 설치 및 빌드

```bash
# 의존성
bun install

# WASM 빌드 (decode) 후 apps/web/public 로 복사
bun run build:wasm

# 예제 사이트 개발 서버
bun run dev
```

브라우저에서 **WASM 로드** → **GIF 선택** → MP4 변환 및 재생/다운로드가 가능합니다.

## 스크립트

| 스크립트                    | 설명                         |
| --------------------------- | ---------------------------- |
| `bun run build:wasm`        | decode WASM 빌드 + copy-wasm |
| `bun run build:wasm:decode` | gif2mp4-decode만 빌드        |
| `bun run copy-wasm`         | pkg-decode → apps/web/public |
| `bun run dev`               | apps/web 개발 서버           |
| `bun run preview`           | apps/web 프리뷰              |

## 문서 사이트

```bash
cd docs && bun run dev
```

또는 루트에서:

```bash
bun run docs:dev
```
