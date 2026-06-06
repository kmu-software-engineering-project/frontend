# Project Structure — 실제 파일 구조

> 구현 구조가 바뀌면 이 문서를 함께 갱신한다.  
> **에이전트 문서(`.claude/agents/`)의 경로 명세와 다를 수 있다. 실제 경로는 이 문서 기준.**

---

## 디렉토리 트리

```
frontend/
├── .claude/                              # Claude Code 하네스
│   ├── agents/                           # 에이전트 역할 문서
│   │   ├── designer.md
│   │   ├── frontend-ai.md
│   │   ├── frontend-ui.md
│   │   └── qa-inspector.md
│   ├── skills/                           # 스킬(워크플로) 문서
│   │   ├── bookweb-orchestrator/
│   │   │   ├── SKILL.md
│   │   │   └── references/shared-files-rules.md
│   │   ├── design-workflow/SKILL.md
│   │   ├── frontend-ai-feature/SKILL.md
│   │   ├── frontend-pages/SKILL.md
│   │   └── qa-frontend/SKILL.md
│   └── settings.local.json               # 로컬 권한 설정
│
├── docs/                                 # Docs as Code
│   ├── architecture.md                   # 시스템 아키텍처
│   ├── project-structure.md             # 이 파일
│   └── sprint/
│       └── sprint-tracker.md            # 스프린트 계획·완료·검증 현황
│
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root Layout (Header + Footer) — B 소유
│   │   ├── globals.css                   # 전역 스타일 — B 소유
│   │   ├── page.tsx                      # 홈 페이지 — B 소유
│   │   │
│   │   ├── recommend/                    # AI 추천 (A 소유)
│   │   │   ├── page.tsx                  # 8단계 설문 폼
│   │   │   └── result/
│   │   │       └── page.tsx              # 5권 카드 그리드 + 팝업
│   │   │
│   │   ├── genres/                       # 장르 (B 소유)
│   │   │   ├── page.tsx                  # 장르별 도서 목록
│   │   │   └── [genre]/page.tsx          # 동적 라우팅
│   │   │
│   │   ├── books/[id]/page.tsx           # 도서 상세 — B 소유
│   │   ├── reviews/page.tsx             # 리뷰 — B 소유
│   │   ├── libraries/                   # 도서관 지도 — B 소유
│   │   │   ├── page.tsx
│   │   │   └── LibrariesMap.tsx
│   │   │
│   │   └── api/                          # Next.js API 라우트 (서버 사이드)
│   │       ├── recommend/route.ts        # AI 추천 → Django 백엔드
│   │       ├── kakao-book/route.ts       # 도서 표지 (Kakao → Aladin fallback)
│   │       ├── reviews/route.ts          # 리뷰 → Django 백엔드
│   │       ├── books/route.ts            # 도서 검색
│   │       ├── libraries/route.ts        # 도서관 위치
│   │       └── saseo/route.ts            # 국립중앙도서관 서지
│   │
│   ├── components/                       # 공통 컴포넌트 — B 소유
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── BookCard.tsx                  # variant: default | compact
│   │   ├── Button.tsx
│   │   ├── Skeleton.tsx
│   │   └── HomeLiveSections.tsx
│   │
│   ├── lib/
│   │   ├── mock.ts                       # Mock 데이터 (Books, Reviews, Libraries) — B 소유
│   │   └── handlers.ts
│   │
│   └── types.ts                          # 공유 타입 (Book, Review, Library, RecommendedBook)
│
├── .env.example                          # 환경 변수 템플릿 (레포 커밋 가능)
├── .env                                  # 실제 키 — .gitignore (커밋 금지)
├── .env.local                            # 로컬 오버라이드 — .gitignore (커밋 금지)
├── .gitignore
├── CLAUDE.md                             # 개발 규칙 최우선 문서
├── next.config.mjs
├── package.json                          # B 소유
├── tailwind.config.ts                    # B 소유
└── tsconfig.json                         # B 소유
```

---

## 에이전트 문서 vs 실제 경로 차이

에이전트 문서는 초기 설계 기준 경로를 사용한다.
실제 구현과 다른 경우 아래 표를 참고한다.

| 에이전트 문서 경로 | 실제 구현 경로 | 비고 |
|-----------------|-------------|------|
| `src/app/ai-recommend/` | `src/app/recommend/` | 라우트명 변경 |
| `src/components/common/*.tsx` | `src/components/*.tsx` | 폴더 단계 제거 |
| `src/types/recommendation.ts` | `src/types.ts` | 타입 통합 파일 |
| `src/types/book.ts` | `src/types.ts` | 타입 통합 파일 |
| `src/lib/mock/books.ts` | `src/lib/mock.ts` | Mock 통합 파일 |
| `src/components/ai/*.tsx` | (페이지 내 통합) | 별도 컴포넌트 미분리 |
| `src/hooks/useBookRecommendation.ts` | (페이지 내 통합) | 별도 훅 미분리 |

---

## 파일 소유권 요약

자세한 충돌 방지 프로토콜은 공통 파일 소유권 문서 참조:  
→ `.claude/skills/bookweb-orchestrator/references/shared-files-rules.md`

| 담당 | 소유 영역 |
|------|----------|
| **B (frontend-ui)** | `src/app/layout.tsx`, `globals.css`, `page.tsx`, `components/`, `lib/mock.ts`, `types.ts` (공유 타입), `package.json`, `tailwind.config.ts`, `tsconfig.json`, `next.config.mjs` |
| **A (frontend-ai)** | `src/app/recommend/` (추천 페이지 전체), `src/app/api/recommend/`, `src/app/api/kakao-book/` |
| **공유 (읽기 전용)** | `types.ts`의 `Book`, `Review`, `Library` — 변경은 B 통해 요청 |
