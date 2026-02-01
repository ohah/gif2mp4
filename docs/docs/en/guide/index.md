# Get Started

## Requirements

- [Bun](https://bun.sh)
- [Rust](https://rustup.rs) + `wasm32-unknown-unknown`:  
  `rustup target add wasm32-unknown-unknown`
- [wasm-pack](https://rustwasm.github.io/wasm-pack/):  
  `cargo install wasm-pack`

### With mise

```bash
mise install
mise exec -- rustup target add wasm32-unknown-unknown
mise run install-wasm-pack   # once
```

## Install and build

```bash
# Dependencies
bun install

# WASM build (decode) and copy to apps/web/public
bun run build:wasm

# Sample app dev server
bun run dev
```

In the browser: **WASM load** → **Choose GIF** → MP4 convert, play, and download.

## Scripts

| Script                     | Description                    |
| -------------------------- | ------------------------------ |
| `bun run build:wasm`       | decode WASM build + copy-wasm  |
| `bun run build:wasm:decode` | build gif2mp4-decode only    |
| `bun run build:wasm:mux`   | build gif2mp4-mux only (opt.) |
| `bun run copy-wasm`        | pkg-decode → apps/web/public  |
| `bun run dev`              | apps/web dev server           |
| `bun run preview`          | apps/web preview              |

## Docs site

```bash
cd docs && bun run dev
```

Or from root:

```bash
bun run docs:dev
```
