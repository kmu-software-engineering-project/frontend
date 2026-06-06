# CLAUDE.md — 도서 웹사이트 프론트엔드 개발 규칙

모든 에이전트와 개발자가 **작업 시작 전 최우선으로 읽어야** 하는 규칙 문서다.

---

## 1. 작업 시작 전 문서 읽기 순서

아래 순서대로 읽는다. 상위 문서가 하위 문서보다 우선한다.

| 순위 | 문서 | 경로 | 갱신 시점 |
|------|------|------|-----------|
| 1 | **이 파일** | `CLAUDE.md` | 규칙 변경 시 |
| 2 | **에이전트 역할 문서** | `.claude/agents/{역할}.md` | 역할 변경 시 |
| 3 | **스프린트 현황** | `docs/sprint/sprint-tracker.md` | 스프린트마다 |
| 4 | **아키텍처** | `docs/architecture.md` | 설계 변경 시 |
| 5 | **실제 파일 구조** | `docs/project-structure.md` | 구현 구조 변경 시 |
| 6 | **설계 산출물** | `_workspace/01_design/` | 설계 변경 시 |
| 7 | **공통 파일 소유권** | `.claude/skills/bookweb-orchestrator/references/shared-files-rules.md` | 충돌 발생 시 |

> **외부 문서 위치 (레포 외부)**
> - 기획·회의: Notion (변경·회의 직후 갱신)
> - 요구사항: GitHub Issues (스프린트마다)
> - Figma: UI 시안 (설계 변경 시)
> - 운영·배포: `docs/ops/` 또는 GitHub Releases

---

## 2. 브랜치 전략

```
main                  — 배포 브랜치. 직접 push 절대 금지
front/harness-setup   — 공통 하네스 설정 전용
front/{작업명}        — 기능/수정 브랜치
```

- `main`에 직접 머지 금지 — PR + 리뷰 필수
- 브랜치명: `front/{이슈번호 또는 작업명}` (소문자, 하이픈 구분)
  - 예: `front/recommend-result`, `front/fix`, `front/sprint2-api`
- 커밋 메시지: `{type}: {설명}` 형식
  - `feat` — 새 기능, `fix` — 버그 수정, `refactor` — 리팩토링
  - `docs` — 문서, `test` — 테스트, `chore` — 빌드·설정
  - 예: `feat: 추천 결과 카드 팝업 구현`, `fix: 카카오 표지 HTTPS 변환`

---

## 3. 4단계 품질 게이트

품질은 한 번에 검증하지 않고, 개발 흐름의 각 지점마다 점진적으로 검증한다.

| 단계 | 시점 | 검증 내용 | 담당 |
|------|------|-----------|------|
| **Gate 1 — 로컬** | 코드 작성 후 | `npx tsc --noEmit` 0 errors, ESLint 경고 없음 | 개발자 본인 |
| **Gate 2 — 커밋 전** | `git commit` 전 | 타입 체크 통과, 브라우저 콘솔 에러 없음, `.env` 미포함 확인 | 개발자 본인 |
| **Gate 3 — PR** | Pull Request 생성 시 | 에이전트 간 인터페이스 정합성, 라우팅 일치, QA 검증 (`/qa` 스킬) | qa-inspector |
| **Gate 4 — 배포 전** | Sprint 6 안정화 | 통합 빌드 성공, 주요 흐름 E2E, 환경 변수 전체 검증 | 팀 전체 |

Gate 1~2는 개발자 각자 책임.
Gate 3는 qa-inspector 에이전트가 실행.
Gate 4는 Sprint 6에서 일괄 수행.

---

## 4. API 키 보안 규칙

**절대 원칙: 실제 키 값을 코드나 git 커밋에 포함하지 않는다.**

| 규칙 | 상세 |
|------|------|
| 모든 API 키는 환경 변수로 분리 | `.env`, `.env.local`에만 저장 |
| `.env`, `.env.local`는 `.gitignore`에 포함 | 실제 키는 레포 커밋 금지 |
| `.env.example`만 레포에 커밋 | 키 이름만, 값은 `your-xxx-key` 형태 |
| 클라이언트 노출 변수만 `NEXT_PUBLIC_` 접두사 | 서버 전용 키에 `NEXT_PUBLIC_` 절대 금지 |
| 서버 키는 API 라우트로만 호출 | `src/app/api/*.ts`에서 처리, 클라이언트 직접 호출 금지 |

관리 중인 환경 변수 목록: `.env.example` 참조.

---

## 5. 테스트 피라미드

```
        ┌─────────────────┐
        │  E2E  (느림)     │  주요 사용자 흐름 (Sprint 6)
        ├─────────────────┤
        │  통합 테스트      │  API 라우트, 훅 연동
        ├─────────────────┤
        │  단위 테스트      │  유틸 함수, 타입 변환 (빠른 피드백)
        └─────────────────┘
```

- 단위 테스트 우선 — 로컬에서 수시 실행 가능하도록 설계
- E2E는 Sprint 6 안정화 단계에서 주요 흐름만 작성
- 현재 테스트 미설치 — Sprint 6 전 최소 단위 테스트 1건 이상 목표

---

## 6. 에이전트 역할 요약

| 에이전트 | 문서 | 담당 영역 |
|---------|------|----------|
| `designer` | `.claude/agents/designer.md` | 와이어프레임, 디자인 시스템, 컴포넌트 스펙 |
| `frontend-ui` (B) | `.claude/agents/frontend-ui.md` | 공통 컴포넌트, 레이아웃, 홈/장르/리뷰/도서관 |
| `frontend-ai` (A) | `.claude/agents/frontend-ai.md` | AI 추천 입력·결과 페이지, 추천 훅 |
| `qa-inspector` | `.claude/agents/qa-inspector.md` | 통합 정합성·라우팅·props 검증 |

오케스트레이터: `.claude/skills/bookweb-orchestrator/SKILL.md`
공통 파일 소유권: `.claude/skills/bookweb-orchestrator/references/shared-files-rules.md`

---

## 7. 모노레포 전체 구조

```
reading/                   ← 최상위 모노레포
├── backend/               — Django REST Framework
├── frontend/              — Next.js (React + TypeScript) ← 이 디렉토리
│   ├── CLAUDE.md          ← (이 파일)
│   ├── docs/              — Docs as Code
│   └── src/
├── docker-compose.yml
└── .github/               — CI/CD 워크플로 (GitHub Actions)
```

프론트엔드 작업은 `frontend/` 하위에서만 수행한다.

---

## 8. 문서 관리 원칙 (Docs as Code)

- `docs/` 폴더의 모든 문서는 코드와 동일한 흐름(PR + 리뷰)으로 버전 관리
- 설계 변경 시 `docs/architecture.md` 동시 갱신
- 스프린트 완료 시 `docs/sprint/sprint-tracker.md` 완료 기록 추가
- 실제 파일 구조 변경 시 `docs/project-structure.md` 동시 갱신
