---
pageType: home

hero:
  name: GIF → MP4
  text: 브라우저에서 GIF를 MP4로 변환
  tagline: gif(Rust WASM) → video(WebCodecs) → mp4(mp4-muxer)
  actions:
    - theme: brand
      text: 데모 체험
      link: /app/
    - theme: alt
      text: 시작하기
      link: /guide/
    - theme: alt
      text: 예시
      link: /example/
    - theme: alt
      text: GitHub
      link: https://github.com/ohah/gif2mp4
  image:
    src: /rspress-icon.png
    alt: 로고
features:
  - title: Rust WASM 디코드
    details: GIF 프레임 추출은 gif2mp4-decode(Rust WASM)로 처리합니다.
    icon: 🦀
  - title: WebCodecs 인코드
    details: H.264 인코딩은 브라우저 WebCodecs VideoEncoder를 사용합니다.
    icon: 🎬
  - title: 순수 TS 뮤스
    details: MP4 컨테이너 뮤스는 mp4-muxer(순수 TypeScript)로 처리합니다.
    icon: 📦
  - title: Bun 모노레포
    details: 루트에서 Bun workspaces로 core·web·docs를 관리합니다.
    icon: 🥟
  - title: 문서 사이트
    details: Rspress로 빌드된 이 문서 사이트에서 사용법을 확인할 수 있습니다.
    icon: 📖
  - title: E2E 테스트
    details: Playwright로 예제 앱 변환·재생 시나리오를 검증합니다.
    icon: ✅
---
