---
name: bookweb-orchestrator
description: "도서 웹사이트(AI 추천, 장르 소개, 리뷰, 도서관 위치) React/Next.js 개발 파이프라인 오케스트레이터. '도서 웹사이트 개발', '개발 시작', '와이어프레임', '디자인', '페이지 구현', '하네스 실행' 요청 시 반드시 이 스킬을 사용. 후속: 디자인 수정, 컴포넌트 재개발, QA 재실행, 특정 페이지만 다시, 이전 결과 개선, 업데이트, 보완 요청 시에도 반드시 이 스킬을 사용."
---

# BookWeb Orchestrator

도서 웹사이트 프론트엔드의 전체 개발 파이프라인을 조율한다.  
디자인 → 프론트엔드 개발(병렬) → QA 검증 순서로 실행한다.

## 실행 모드: 하이브리드

| Phase | 모드 | 이유 |
|-------|------|------|
| Phase 2: 디자인 | 서브 에이전트 | designer 단독 작업, 팀 통신 불필요 |
| Phase 3: 프론트엔드 개발 | 에이전트 팀 | frontend-ai ↔ frontend-ui 공통 컴포넌트 협업 필수 |
| Phase 4: QA | 서브 에이전트 | qa-inspector 독립 검증, 독립성이 중요 |

## 에이전트 구성

| 에이전트 | 타입 | 역할 | 주요 산출물 |
|---------|------|------|-----------|
| designer | 커스텀 | 와이어프레임 + 디자인 시스템 + 컴포넌트 스펙 | `_workspace/01_design/` |
| frontend-ui | 커스텀 | 공통 컴포넌트 + 장르/리뷰/도서관 페이지 | `src/components/`, `src/app/` |
| frontend-ai | 커스텀 | AI 추천 페이지 + 훅 구현 | `src/app/ai-recommend/`, `src/components/ai/` |
| qa-inspector | 커스텀 | 통합 정합성 + 디자인 스펙 준수 검증 | `_workspace/03_qa/qa-report.md` |

## 워크플로우

### Phase 0: 컨텍스트 확인

`_workspace/` 존재 여부 확인:
- **미존재** → 초기 실행. Phase 1로 진행
- **존재 + 부분 수정 요청** (예: "QA만 다시", "디자인 수정") → 해당 Phase만 재실행. 기존 산출물 유지
- **존재 + 새 요구사항** → 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1 진행

### Phase 1: 준비

1. 사용자 입력 분석 (요구사항, 수정 범위, 우선순위)
2. 아래 구조 생성:
   ```
   _workspace/
   ├── 00_input/requirements.md   ← 요구사항 정리
   ├── 01_design/
   ├── 02_frontend/
   └── 03_qa/
   ```

### Phase 2: 디자인
**실행 모드: 서브 에이전트**

```
Agent(
  subagent_type: "designer",
  model: "opus",
  prompt: "design-workflow 스킬을 읽고 도서 웹사이트 디자인 작업을 수행하라.
           요구사항: _workspace/00_input/requirements.md
           산출물을 _workspace/01_design/ 에 저장한다.",
  run_in_background: false
)
```

완료 후 `_workspace/01_design/` 산출물 확인:
- `wireframes.md`, `design-system.md`, `component-specs.md` ✓
- `page-specs/ai-recommend.md`, `genres.md`, `reviews.md`, `libraries.md` ✓

### Phase 3: 프론트엔드 개발
**실행 모드: 에이전트 팀**

> **공통 파일 규칙 참조**: `.claude/skills/bookweb-orchestrator/references/shared-files-rules.md`  
> 핵심 원칙: package.json, layout.tsx, globals.css, tailwind.config, App.tsx 등 공통 파일은 B(frontend-ui)가 단독 소유. A(frontend-ai)는 직접 수정하지 않고 SendMessage로 요청한다.

1. 팀 생성:
   ```
   TeamCreate(
     team_name: "frontend-team",
     members: [
       {
         name: "frontend-ui",
         agent_type: "frontend-ui",
         model: "opus",
         prompt: "frontend-pages 스킬을 읽고 다음 순서로 작업하라:
                  1. 공통 컴포넌트(BookCard, Button, Header, Footer) 구현
                  2. 완성 즉시 frontend-ai에게 SendMessage (props 인터페이스 포함)
                  3. 홈, 장르, 도서 상세, 리뷰, 도서관 위치 페이지 구현
                  4. package.json, layout.tsx, globals.css 등 공통 파일 수정 요청이 오면 즉시 처리 후 알림
                  디자인 스펙: _workspace/01_design/
                  공통 파일 규칙: .claude/skills/bookweb-orchestrator/references/shared-files-rules.md"
       },
       {
         name: "frontend-ai",
         agent_type: "frontend-ai",
         model: "opus",
         prompt: "frontend-ai-feature 스킬을 읽고 AI 추천 입력/결과 페이지, 추천 API 연동, 추천 결과 UI, 추천 타입 정의를 구현하라.
                  공통 컴포넌트 완성 전에는 임시 인라인 컴포넌트로 진행한다.
                  frontend-ui로부터 공통 컴포넌트 완성 알림 수신 후 교체한다.
                  package.json, layout.tsx, globals.css 등 공통 파일은 직접 수정하지 말고 frontend-ui에게 SendMessage로 요청한다.
                  디자인 스펙: _workspace/01_design/page-specs/ai-recommend.md
                  공통 파일 규칙: .claude/skills/bookweb-orchestrator/references/shared-files-rules.md"
       }
     ]
   )
   ```

2. 작업 등록:
   ```
   TaskCreate(tasks: [
     {
       title: "공통 컴포넌트 구현 (B)",
       assignee: "frontend-ui",
       description: "BookCard(reason prop optional 포함), Button, Header, Footer, Skeleton 구현.
                     완성 후 frontend-ai에게 SendMessage (props 인터페이스 전문 포함).
                     package.json, layout.tsx, globals.css 등 공통 파일 초기 설정도 담당."
     },
     {
       title: "추천 타입 정의 및 훅 구현 (A)",
       assignee: "frontend-ai",
       description: "src/types/recommendation.ts, useBookRecommendation.ts, lib/mock/recommendation.ts 작성.
                     패키지 필요 시 frontend-ui에게 SendMessage로 요청."
     },
     {
       title: "AI 추천 입력/결과 페이지 초안 (A)",
       assignee: "frontend-ai",
       depends_on: ["추천 타입 정의 및 훅 구현 (A)"],
       description: "공통 컴포넌트 완성 전 임시 인라인으로 진행.
                     layout.tsx, globals.css 등 공통 파일은 직접 수정하지 않는다."
     },
     {
       title: "공통 컴포넌트 교체 (A)",
       assignee: "frontend-ai",
       depends_on: ["공통 컴포넌트 구현 (B)", "AI 추천 입력/결과 페이지 초안 (A)"],
       description: "임시 인라인 컴포넌트를 frontend-ui의 완성본으로 교체."
     },
     {
       title: "홈/장르/도서 상세/리뷰/도서관 페이지 구현 (B)",
       assignee: "frontend-ui",
       depends_on: ["공통 컴포넌트 구현 (B)"]
     }
   ])
   ```

3. 팀 조율 포인트:
   - B → A: 공통 컴포넌트 완성 알림 (SendMessage, props 인터페이스 포함)
   - A → B: 패키지 설치 요청, BookCard 추가 props 요청 (SendMessage)
   - B → A: 공통 파일 변경 완료 알림 (package.json 업데이트 시 git pull 안내 포함)
   - 블로커 발생 시 리더에게 즉시 알림
   - TaskGet으로 진행 상황 주기적 확인
   - **공통 파일 충돌 감지 시**: 두 에이전트가 같은 파일 수정을 시도하면 즉시 중재

4. 모든 작업 완료 후 `TeamDelete`

### Phase 4: QA 검증
**실행 모드: 서브 에이전트**

```
Agent(
  subagent_type: "qa-inspector",
  model: "opus",
  prompt: "qa-frontend 스킬을 읽고 통합 정합성 검증을 수행하라.
           디자인 스펙: _workspace/01_design/
           소스코드: src/
           결과: _workspace/03_qa/qa-report.md",
  run_in_background: false
)
```

QA 결과 처리:
- ❌ CRITICAL 항목: 해당 에이전트를 재호출하여 수정 → QA 재실행
- ⚠️ WARNING 항목: 사용자에게 보고하고 판단 요청

### Phase 5: 마무리

1. `_workspace/` 보존 (중간 산출물 유지)
2. 사용자에게 최종 보고:
   - 구현된 페이지 목록
   - QA 결과 요약 (`_workspace/03_qa/qa-report.md`)
   - 백엔드 연동 시 교체할 mock 파일 목록 (`src/lib/mock/`)
   - 배포 전 체크리스트 (환경 변수 `NEXT_PUBLIC_MAP_API_KEY` 등)

## 데이터 흐름

```
[요구사항] → _workspace/00_input/requirements.md
    ↓ Phase 2 (서브 에이전트)
[designer] → _workspace/01_design/ (wireframes, design-system, component-specs, page-specs)
    ↓ Phase 3 (에이전트 팀)
[frontend-ui] ←SendMessage→ [frontend-ai]
공통 컴포넌트 완성 알림↗   ↖추가 props 요청
    ↓                          ↓
src/components/common/    src/app/ai-recommend/
src/app/genres,reviews,   src/components/ai/
libraries/                src/hooks/
    ↓ Phase 4 (서브 에이전트)
[qa-inspector] → _workspace/03_qa/qa-report.md
    ↓ Phase 5
[최종 보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| designer 실패 | 1회 재시도. 재실패 시 기존 `_workspace/01_design/` 활용 또는 수동 입력 요청 |
| 팀원 1명 실패/중지 | SendMessage로 상태 확인 → 재시작 또는 작업 재할당 |
| 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
| QA CRITICAL 실패 | 해당 에이전트 재호출 후 수정, QA 재실행 |
| 지도 API 미설정 | qa-inspector가 ⚠️로 기록, 배포 전 환경 변수 설정 안내 |
| A가 공통 파일 직접 수정 시도 | SendMessage로 중단 요청, B에게 처리 위임 |
| 패키지 설치 요청 미처리로 A 블로킹 | B에게 SendMessage로 즉시 처리 촉구 |

## 테스트 시나리오

### 정상 흐름
1. "도서 웹사이트 개발 시작해줘" → Phase 0~5 전체 실행
2. designer가 4개 page-specs + design-system + component-specs 생성
3. frontend-team 구성 → frontend-ui가 공통 컴포넌트 완성 후 frontend-ai에게 알림
4. 두 개발자가 병렬로 각 담당 페이지 구현
5. qa-inspector가 통합 정합성 검증, qa-report.md 생성
6. 사용자에게 결과 요약 보고

### 에러 흐름
1. frontend-ui의 지도 API 연동 실패
2. 텍스트 기반 목록으로 폴백 처리 후 리더에게 보고
3. qa-inspector가 ⚠️ 경고 항목으로 기록
4. Phase 5에서 사용자에게 환경 변수 설정 안내 포함하여 보고
