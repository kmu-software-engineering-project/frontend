---
name: design-workflow
description: "도서 웹사이트의 와이어프레임, 디자인 시스템, 공통 컴포넌트 스펙을 생성하는 디자인 워크플로우 스킬. 페이지 레이아웃 설계, 색상/타이포그래피 시스템 정의, 컴포넌트 props 명세 작성. '와이어프레임', '디자인 스펙', '컴포넌트 명세', '디자인 시스템' 요청 시 반드시 이 스킬을 사용."
---

# Design Workflow

도서 웹사이트의 UI/UX 설계 산출물을 생성한다.

## 산출물 목록

`_workspace/01_design/`에 아래 파일을 생성한다:

| 파일 | 내용 |
|------|------|
| `wireframes.md` | 페이지별 ASCII 와이어프레임 + 레이아웃 설명 |
| `design-system.md` | 색상 팔레트, 타이포그래피, 간격 토큰 |
| `component-specs.md` | 공통 컴포넌트 props/상태/이벤트 명세 |
| `page-specs/ai-recommend.md` | AI 추천 페이지 상세 스펙 |
| `page-specs/genres.md` | 장르 페이지 상세 스펙 |
| `page-specs/reviews.md` | 리뷰 페이지 상세 스펙 |
| `page-specs/libraries.md` | 도서관 위치 페이지 상세 스펙 |

**우선순위**: `component-specs.md` → `design-system.md` → 페이지별 스펙
두 프론트엔드 개발자가 component-specs.md를 인터페이스 계약으로 사용하므로 가장 먼저, 가장 명확하게 작성한다.

## 1. wireframes.md 작성 방법

ASCII로 각 페이지 레이아웃을 표현한다:

```
## /ai-recommend — AI 도서 추천
┌─────────────────────────────────────┐
│ [Logo] BookFinder   홈 AI추천 장르 리뷰 도서관 │  ← Header
├─────────────────────────────────────┤
│        AI 도서 추천                  │
│ ┌────────────────────────────────┐  │
│ │ 선호 장르 (복수 선택)            │  │
│ │ [소설] [시] [에세이] [SF] ...   │  │
│ │ 현재 기분                       │  │
│ │ [😊 설렘] [😌 편안] [🤔 고민]  │  │
│ │ 최근 읽은 책 (선택)              │  │
│ │ [________________]              │  │
│ │         [추천 받기 →]           │  │
│ └────────────────────────────────┘  │
│ 추천 결과                           │
│ [BookCard] [BookCard] [BookCard]    │
├─────────────────────────────────────┤
│ [Footer]                            │  ← Footer
└─────────────────────────────────────┘
모바일(375px): 카드 1열, 장르 버튼 wrap
```

## 2. design-system.md 작성 방법

CSS 변수 형식으로 정의한다:

```css
/* 색상 — 도서/독서 테마 (따뜻하고 차분한 톤) */
--color-primary: #4A6FA5;        /* 주 색상: 도서관 블루 */
--color-primary-hover: #3A5F95;
--color-secondary: #C9956A;      /* 보조: 따뜻한 브라운 */
--color-surface: #FAFAF7;        /* 페이지 배경 */
--color-surface-raised: #FFFFFF; /* 카드 배경 */
--color-text-primary: #1A1A2E;
--color-text-secondary: #4B5563;
--color-text-muted: #9CA3AF;
--color-border: #E5E7EB;

/* 타이포그래피 */
--font-heading: 'Noto Serif KR', 'Georgia', serif;
--font-body: 'Noto Sans KR', 'Arial', sans-serif;
--text-4xl: 2.25rem; --text-3xl: 1.875rem; --text-2xl: 1.5rem;
--text-xl: 1.25rem; --text-lg: 1.125rem; --text-base: 1rem;
--text-sm: 0.875rem; --text-xs: 0.75rem;

/* 간격 */
--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
--space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

/* 그림자 */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
--shadow-card: 0 2px 8px rgba(0,0,0,0.10);
--shadow-card-hover: 0 4px 16px rgba(0,0,0,0.15);

/* 반응형 breakpoint */
--bp-mobile: 375px;
--bp-tablet: 768px;
--bp-desktop: 1280px;
```

## 3. component-specs.md 작성 방법

각 공통 컴포넌트에 대해 아래 형식으로 작성한다:

```markdown
### BookCard
props:
  - id: string
  - title: string
  - author: string
  - genre: string
  - rating: number          # 0~5, 소수점 1자리
  - thumbnailUrl?: string   # 없으면 기본 표지 이미지
  - reason?: string         # AI 추천 이유 (AI 추천 페이지에서만 사용)
  - variant?: 'default' | 'compact' | 'featured'
  - onClick?: () => void
상태:
  - default: 기본 카드
  - hover: shadow-card-hover 적용, 살짝 위로 이동 (transform: translateY(-2px))
  - loading: Skeleton으로 대체
이벤트: onClick → /books/[id] 이동

### Button
props:
  - variant?: 'primary' | 'secondary' | 'ghost'  # 기본: primary
  - size?: 'sm' | 'md' | 'lg'                    # 기본: md
  - loading?: boolean   # true면 스피너 표시
  - disabled?: boolean
  - type?: 'button' | 'submit'
  - onClick?: () => void
  - children: React.ReactNode

### Tag
props:
  - label: string
  - color?: string   # 장르별 고정 색상 or 자동 매핑

### Skeleton
props:
  - variant?: 'card' | 'text' | 'circle'
  - count?: number   # 기본: 1
```

필수 공통 컴포넌트: `BookCard`, `Button`, `Tag`, `Badge`, `Skeleton`, `StarRating`, `Header`, `Footer`, `NavBar`

## 4. page-specs/ 작성 방법

각 페이지 스펙에 포함할 내용:
1. **목적** — 한 줄 요약
2. **주요 섹션** — 화면에 표시되는 영역 목록
3. **사용 컴포넌트** — 공통 컴포넌트 명시
4. **데이터 연동** — 어떤 훅/API로 데이터를 가져오는지
5. **인터랙션** — 사용자 행동 → 화면 변화
6. **상태** — 로딩 / 에러 / 빈 상태 처리
7. **반응형** — 모바일/태블릿/데스크탑 레이아웃 차이
