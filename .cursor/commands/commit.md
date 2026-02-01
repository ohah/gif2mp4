# 커밋 메시지 룰 (한글)

아래 규칙에 맞춰 커밋 메시지를 한글로 작성해 주세요.

## 커밋 전 체크 (액션과 동일)

커밋하기 **전에** 아래를 실행해 모두 통과한 뒤 커밋한다.

1. **포맷**
   - `bun run format:check` — TS/JS·MD 등 포맷 검사 (oxfmt)
   - 실패 시 `bun run format` 으로 수정 후 다시 체크
   - Rust 수정 시: `bun run format:rust:check` (실패 시 `bun run format:rust`)

2. **린트**
   - `bun run lint` — TS/JS 린트 (oxlint)
   - Rust 수정 시: `cargo clippy --all-targets --all-features -- -D warnings`

3. **빌드**
   - `bun run build` — WASM·워크스페이스 빌드
   - 문서만 수정한 경우: `bun run docs:build` 로 문서 빌드 확인

위 체크 중 해당하는 것만 돌려도 되지만, 변경 범위가 불확실하면 전부 실행하는 것을 권장한다.

## 규칙

- **언어**: 한글로 작성한다.
- **형식**: 제목은 간단한 동사/명사 구문, 본문은 필요 시 이유·영향 범위를 한글로 적는다.

## 예시 (좋음)

```
Initial commit: GIF→MP4 (Rust decode, WebCodecs encode, mp4-muxer)
```

```
docs: Rspress 문서 사이트 추가
```

```
fix: mp4-muxer frameRate 정수 변환으로 브라우저 재생 오류 해결
```

## 예시 (피할 것)

- 영문만 사용한 제목 (프로젝트 기본이 한글인 경우)
- `fix`, `update` 등만 있고 무엇을 고쳤는지 불명확한 제목

## 브랜치

- `main`: 기본 배포 브랜치
- 기능/수정: `feature/이름` 또는 `fix/이름` 형태 사용 권장
