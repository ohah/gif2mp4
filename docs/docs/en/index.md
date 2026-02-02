---
pageType: home

hero:
  name: GIF → MP4
  text: Convert GIF to MP4 in the browser
  tagline: gif(Rust WASM) → video(WebCodecs) → mp4(mp4-muxer)
  actions:
    - theme: brand
      text: Try Demo
      link: /app/
    - theme: alt
      text: Get Started
      link: /en/guide/
    - theme: alt
      text: Example
      link: /en/example/
    - theme: alt
      text: GitHub
      link: https://github.com/ohah/gif2mp4
  image:
    src: /rspress-icon.png
    alt: Logo
features:
  - title: Rust WASM Decode
    details: GIF frame extraction is handled by gif2mp4-decode (Rust WASM).
    icon: 🦀
  - title: WebCodecs Encode
    details: H.264 encoding uses the browser WebCodecs VideoEncoder.
    icon: 🎬
  - title: Pure TS Mux
    details: MP4 container muxing is done with mp4-muxer (pure TypeScript).
    icon: 📦
  - title: Bun Monorepo
    details: Core, web app, and docs are managed with Bun workspaces at the root.
    icon: 🥟
  - title: Docs Site
    details: This Rspress site documents usage and API.
    icon: 📖
  - title: E2E Tests
    details: Playwright verifies the sample app convert-and-play flow.
    icon: ✅
---
