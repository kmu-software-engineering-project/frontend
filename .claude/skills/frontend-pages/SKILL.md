---
name: frontend-pages
description: "장르별 도서 소개, 도서 리뷰, 도서관 위치 페이지 및 공통 UI 컴포넌트(Header, Footer, BookCard, Button 등) 구현 가이드. Next.js App Router 기반. '장르 페이지', '리뷰 기능', '도서관 지도', '공통 컴포넌트', 'Header', 'BookCard 구현', '라우팅 설정' 요청 시 반드시 이 스킬을 사용."
---

# Frontend Pages

공통 UI 컴포넌트와 장르·리뷰·도서관 페이지 구현 가이드.

## 구현 순서 (반드시 준수)

1. **공통 컴포넌트** → frontend-ai가 기다리고 있다. 완성 즉시 SendMessage 알림
2. Root Layout (`src/app/layout.tsx`)
3. 장르 페이지 → 리뷰 페이지 → 도서관 위치 페이지

## 1. 공통 컴포넌트 (src/components/common/)

### BookCard — 두 개발자 공유, 인터페이스 계약

```typescript
// src/components/common/BookCard.tsx
interface BookCardProps {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;           // 0~5
  thumbnailUrl?: string;    // 없으면 기본 표지 이미지 표시
  reason?: string;          // AI 추천 이유 — frontend-ai에서 사용, optional
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
}
```

`reason` prop은 optional로 선언한다. AI 추천 페이지에서만 전달되며, 일반 장르/리뷰 페이지에서는 생략된다.

완성 즉시 frontend-ai에게 SendMessage로 위 인터페이스 전문을 알린다.

### Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: React.ReactNode;
}
```

### Header / NavBar

네비게이션 링크 (href가 실제 page 파일 경로와 정확히 일치해야 한다):
- 홈: `/`
- AI 추천: `/ai-recommend`
- 장르: `/genres`
- 리뷰: `/reviews`
- 도서관: `/libraries`

모바일에서는 햄버거 메뉴로 접힌다. `'use client'` 필요.

### 기타 컴포넌트

- `Tag` — 장르 태그, `label: string`, 장르별 색상 매핑
- `Skeleton` — `variant?: 'card' | 'text' | 'circle'`, `count?: number`
- `StarRating` — `rating: number`, 반쪽 별 지원
- `Badge` — 숫자 배지 (리뷰 수 등)

## 2. 라우팅 구조

```
src/app/
├── layout.tsx               # Root Layout — Header + Footer 포함
├── page.tsx                 # 홈: 히어로 배너 + 장르 바로가기 + 인기 도서
├── ai-recommend/
│   └── page.tsx             # (frontend-ai 담당)
├── genres/
│   ├── page.tsx             # 장르 목록 그리드
│   └── [genre]/
│       └── page.tsx         # 장르별 도서 목록
├── books/
│   └── [id]/
│       └── page.tsx         # 도서 상세 + 리뷰
├── reviews/
│   └── page.tsx             # 전체 최신 리뷰
└── libraries/
    └── page.tsx             # 도서관 위치 지도
```

**QA에서 가장 자주 발견되는 버그**: href 경로와 실제 파일 경로 불일치.  
링크를 추가할 때마다 위 구조와 대조하여 확인한다.

## 3. 타입 정의 (src/types/)

```typescript
// book.ts
export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  thumbnailUrl?: string;
  description: string;
  publishedYear: number;
}

export const GENRES = ['소설', '시', '에세이', '자기계발', 'SF', '추리', '역사', '철학'] as const;
export type Genre = typeof GENRES[number];

// review.ts
export interface Review {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  reviewer: string;
  rating: number;
  content: string;
  createdAt: string;
}

// library.ts
export interface Library {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
}
```

## 4. Mock 데이터 (src/lib/mock/)

각 파일은 `fetchXxx` 함수를 export한다. 실제 API 연동 시 함수 구현만 교체한다:

```typescript
// books.ts
export async function fetchBooksByGenre(genre: string): Promise<Book[]> { ... }
export async function fetchBookById(id: string): Promise<Book | null> { ... }

// reviews.ts
export async function fetchReviews(): Promise<Review[]> { ... }
export async function fetchReviewsByBook(bookId: string): Promise<Review[]> { ... }

// libraries.ts
export async function fetchLibraries(): Promise<Library[]> { ... }
```

## 5. 장르 페이지

- `/genres`: GENRES 배열을 카드 그리드로 표시. 각 카드 클릭 → `/genres/${encodeURIComponent(genre)}`
- `/genres/[genre]`: `decodeURIComponent(params.genre)`로 장르명 복원 후 `fetchBooksByGenre` 호출
- BookCard를 그리드로 표시. 클릭 → `/books/${book.id}`

## 6. 리뷰 페이지

- `/reviews`: 최신 리뷰 목록. 리뷰 카드에 도서 제목/저자/평점/본문 요약 표시
- `/books/[id]`: 도서 상세 (Book 정보) + 해당 도서 리뷰 목록

## 7. 도서관 위치 페이지 (`/libraries`)

**지도 라이브러리 선택:**
- Leaflet (`react-leaflet`) — 오픈소스, API 키 불필요, 권장
- 카카오맵 — `NEXT_PUBLIC_MAP_API_KEY` 환경 변수 필요

지도 컴포넌트는 반드시 `'use client'`를 선언한다 (SSR 비호환).

```typescript
// 지도 API 키 참조 방식
const mapApiKey = process.env.NEXT_PUBLIC_MAP_API_KEY;
if (!mapApiKey) {
  // 폴백: 텍스트 목록으로 표시
}
```

지도 초기화 실패 또는 키 미설정 시 도서관 정보를 텍스트 목록으로 폴백 표시한다.

## 8. Root Layout (src/app/layout.tsx)

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

폰트: `next/font`로 Noto Sans KR + Noto Serif KR 로드.
