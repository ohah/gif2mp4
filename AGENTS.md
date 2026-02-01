# 에이전트(AI) 작업 가이드

이 문서는 Cursor/에이전트가 이 저장소에서 작업할 때 따를 공통 규칙입니다.

## 공통 원칙

- **응답 언어**: 사용자 요청이 한글이면 한글로 답한다.
- **폴백 금지**: "FALLBACK 스크립트" 또는 실패 시 대체 경로를 새로 만들지 않는다. 한 가지 방식만 유지한다.
- **의존성**: Mediabunny 등 외부 인코딩/뮤스 라이브러리 대신, 프로젝트 파이프라인(gif→decode→WebCodecs→mp4-muxer)만 사용한다.

## 프로젝트 구조

- **디코드**: Rust WASM (`crates/gif2mp4-decode`) → `packages/core`에서 `initDecode()`로 주입
- **인코드**: WebCodecs VideoEncoder (순수 TS, `packages/core`)
- **뮤스**: mp4-muxer (순수 TS, `packages/core`)
- **앱**: `apps/web` (Vite + React), decode WASM만 로드하고 `gifToMp4()` 호출

## 코드/스크립트 규칙

- 새 스크립트나 빌드 단계를 추가할 때는 루트 `package.json`·`scripts/`·`mise.toml`에 맞춰 정리한다.
- WASM 빌드 결과는 `scripts/copy-wasm.js`로 `apps/web/public`에 복사하는 방식만 사용한다.
- 테스트는 `tests/e2e`(Playwright) 기준으로, 기존 플로우를 깨지 않도록 수정한다.

## 문서·규칙

- 문서·주석·커밋 메시지·PR 설명은 **한글**을 기본으로 한다.
- `docs/`(Rspress) 문서 사이트는 설치된 구조와 스크립트를 유지한 채로 업데이트한다.

## 참고

- 커밋/PR 규칙: `.cursor/commands/commit-pr.md` (커맨드로 실행)
