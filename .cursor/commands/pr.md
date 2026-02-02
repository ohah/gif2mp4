# PR(Pull Request) 룰 (한글)

아래 규칙에 맞춰 PR 제목·설명을 한글로 작성해 주세요. (참고: D:\ohah\crd 의 pr·라벨·어사인 방식과 동일하게 적용.)

## 규칙

- **브랜치**: 이미 `main`에 있으면 새 브랜치를 만든 뒤 그 브랜치에서 커밋·푸시하고, `main`으로 PR을 보낸다. (예: `git checkout -b feature/이름` 또는 `fix/이름` → 커밋 → 푸시 → PR 생성.)
- **PR 생성·갱신**: 이미 커밋된 내용을 `git push`로 푸시해서 PR을 만들거나 갱신한다. (먼저 커밋한 뒤 푸시.)
- **제목**: 한글로, 변경 내용을 한 줄로 요약한다.
- **설명**: 다음을 한글로 적는다.
  - 무엇을 바꿨는지
  - 왜 바꿨는지
  - 영향 받는 스크립트/앱이 있으면 언급
- **체크리스트**(선택): 빌드·테스트·문서 반영 여부를 적어두면 좋다.

## 리뷰어·오너 (GitHub 설정)

- **CODEOWNERS** (`.github/CODEOWNERS`): 저장소 전체 `*` → `@ohah`. PR 생성 시 GitHub가 **ohah**를 리뷰어로 자동 요청한다.
- **Copilot**: PR 화면에서 Reviewers 메뉴 → **Copilot** 선택 시 Copilot 코드 리뷰를 받을 수 있다. (필요 시 수동 추가.)

## 라벨·어사인 (자동 선택)

- **PR 생성 시**: `gh pr create`에 `--assignee @me`(또는 이 레포 기준 `ohah`), `--label <이름>`(여러 개 가능)을 넣는다.
- **라벨**: `gh label list`로 목록 확인 후 PR 성격에 맞는 라벨 선택 (예: `feat`, `fix`, `docs`, `chore`). 생성 시 `--label feat --label config` 형태로 지정.
- **PR 갱신 시**: 라벨 추가는 `gh pr edit <PR번호> --add-label <이름>`.
- **어사인**: 생성 시 `--assignee @me` 또는 `--assignee ohah`로 담당자 지정.

## PR 생성 시 실행 예 (에이전트)

- PR 생성: `gh pr create --base main --title "제목" --body-file .pr-body.md --assignee @me --label feat` (라벨은 PR 성격에 맞게 `gh label list`에서 선택, 여러 개면 `--label feat --label docs` 등으로 추가.)
- PR 갱신(이미 열린 PR): `gh pr edit <번호> --add-label <이름>` 필요 시 사용.

## PR 설명 예시

```markdown
## 변경 내용

- Mediabunny 제거 후 mp4-muxer로 뮤스 통일

## 이유

- 브라우저 재생 호환성 확보 및 의존성 단순화

## 확인

- [ ] `bun run build:wasm` 통과
- [ ] `bun run dev` 로 변환·재생 확인
```
