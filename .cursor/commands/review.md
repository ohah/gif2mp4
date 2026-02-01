# PR 리뷰 (AI 리뷰 + 요약·인라인 제안)

현재 브랜치의 PR을 가져와 AI가 코드·설명을 검토한 뒤, **요약 리뷰(본문)**와 **행 단위 제안(인라인 코멘트)**를 PR에 올린다.

- **요약 리뷰**: 리뷰 본문을 **한글**로 작성한다. PR 목적·설명과 변경 내용 일치 여부, 잘된 점, 개선 제안(버그·엣지 케이스·성능·테스트), 테스트 안내를 포함한다.
- **행 단위 제안**: 구체적인 코드 수정이 필요한 곳은 해당 파일/행에 인라인 코멘트를 달고, 필요 시 ` ```suggestion ``` ` 블록을 넣어 작성자가 GitHub에서 적용할 수 있게 한다. 설명은 한글로 짧게.

## 이 저장소용 gh 계정 (ohah 전용)

이 저장소(ohah/gif2mp4)는 리뷰 게시 시 **ohah** GitHub 계정을 사용한다.

- **제출 전**: `gh api user -q .login`으로 현재 사용자 확인. 결과가 `ohah`가 아니면 `gh auth switch --hostname github.com --user ohah` 실행 후 **이전 로그인을 기억** (예: `PREV_GH_USER=<값>`).
- **제출 후**: 1단계에서 ohah로 바꿨다면 `gh auth switch --hostname github.com --user <PREV_GH_USER>`로 원래 계정 복원.

## 진행 순서

1. **브랜치 및 gh 계정 (이 저장소 / ohah 전용)**
   - 저장소 루트에서 실행. 리뷰 대상은 **현재 브랜치**의 PR.
   - 현재 gh 사용자 확인: `gh api user -q .login`. `ohah`가 아니면 `gh auth switch --hostname github.com --user ohah` 후 이전 로그인을 저장해 두었다가 나중에 복원.

2. **현재 브랜치의 PR 찾기**
   - PR이 없으면 "현재 브랜치에 해당하는 PR이 없습니다"라고 하고 종료.

   ```bash
   gh pr view --json number,title,body,url,additions,deletions,changedFiles
   ```

   - 실패 시(PR 없음): `gh pr list --head $(git branch --show-current)`로 확인.

3. **PR 정보·diff 수집**
   - PR 메타·본문: `gh pr view`
   - 변경 파일: `gh pr diff --name-only`
   - 전체 diff: `gh pr diff`
   - 위 내용으로 리뷰 맥락 구성.

4. **AI 리뷰 작성 (요약 + 행 제안)**
   - **요약 본문** (한글):
     - **목적·설명**: PR 목적·설명이 변경 내용과 맞는지
     - **잘된 점**: 구조, 네이밍, 컨벤션, 일관성
     - **개선 제안**: 버그·엣지 케이스·성능·테스트 등
   - **행 단위 제안**: 수정이 필요한 곳마다 인라인 코멘트를 준비한다:
     - **path**: 저장소 루트 기준 경로 (예: `packages/core/src/gif-to-mp4.ts`)
     - **line**: diff의 **새(오른쪽)** 쪽 행 번호
     - **side**: `"RIGHT"`
     - **body**: 한글로 짧은 설명; 구체적인 코드 수정이면 ` ```suggestion ``` ` 블록을 넣어 GitHub에서 "제안 적용"이 보이게 한다.

5. **리뷰 제출 (인라인이 있으면 요약+인라인 한 번에)**
   - **5-a. 인라인 제안이 하나 이상 있을 때**
     **body**와 **comments** 배열을 모두 포함한 리뷰 **한 건**으로 제출.
     - **body**: 4단계에서 쓴 요약(잘된 점, 개선 제안, 테스트 안내). 한글로.
     - **comments**: 제안마다 한 항목씩:
       - **path**: 저장소 루트 기준 경로
       - **line**: diff의 **새(오른쪽)** 쪽 행 번호. 실제 파일과 맞는지 확인.
       - **side**: `"RIGHT"`
       - **body**: 한글로 짧은 설명 + (해당 시) ` ```suggestion ` … ` ``` ` 블록.
     - 페이로드 예시 (`review-payload.json`):
       ````json
       {
         "commit_id": "<headRefOid>",
         "event": "COMMENT",
         "body": "## AI 리뷰\n\n### 잘된 점\n- ...\n\n### 개선 제안\n- ...\n\n### 테스트\n- ...",
         "comments": [
           {
             "path": "packages/core/src/gif-to-mp4.ts",
             "line": 42,
             "side": "RIGHT",
             "body": "재시도 타임아웃 해제를 권장합니다.\n\n```suggestion\n  clearTimeout(id);\n```"
           }
         ]
       }
       ````
     - 명령:
       ```bash
       gh pr view --json headRefOid -q .headRefOid   # commit_id로 사용
       gh api repos/ohah/gif2mp4/pulls/$(gh pr view --json number -q .number)/reviews --input review-payload.json
       ```
     - 제출 후 `review-payload.json`은 삭제해도 됨.

   - **5-b. 인라인 제안이 없을 때**
     요약만 코멘트 한 건으로 게시:

     ```bash
     gh pr comment $(gh pr view --json number -q .number) --body-file review-comment.md
     ```

     (4단계 요약을 먼저 `review-comment.md`에 적어 둔다. 게시 후 삭제해도 됨.)

   - **규칙**: 행 단위 제안이 있으면 5-a(본문+코멘트 한 번). 없으면 5-b(코멘트만).

6. **gh 계정 복원 (이 저장소 / ohah 전용)**: 1단계에서 ohah로 바꿨다면 `gh auth switch --hostname github.com --user <PREV_GH_USER>`로 원래 계정 복원.

## 참고

- 저장소 루트에서 `gh` 인증된 상태로 실행. 이 저장소(ohah/gif2mp4): 리뷰 게시는 ohah 사용; 제출 전 전환, 제출 후 복원(위 "gh 계정" 및 1·6단계 참고).
- 현재 브랜치에 PR이 없으면 리뷰를 게시하지 않고, 위 메시지만 출력.
- **인라인 코멘트**: `line`은 diff의 **새(오른쪽)** 쪽 행 번호여야 하고, `side`는 `"RIGHT"`. 잘못된 행 번호는 422를 유발할 수 있으니 실제 파일과 맞는지 확인.
- **제안 블록**: 코멘트 본문에서 제안 코드는 ` ```suggestion ` 와 ` ``` ` 사이에 넣으면 GitHub에 "제안 적용"이 표시됨.
- GitHub 코멘트 길이 제한 안에서, 불릿·짧은 문단으로 작성.
