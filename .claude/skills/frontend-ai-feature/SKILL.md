---
name: frontend-ai-feature
description: "도서 AI 추천 기능의 React/Next.js 구현 가이드. AI API 연동 훅, 취향 입력 폼(장르/기분/최근 도서), 추천 결과 카드 목록, 로딩/에러/빈 상태 처리, mock 데이터 구조. 'AI 추천 페이지', '추천 훅', 'useBookRecommendation', 'AI 기능 구현' 요청 시 반드시 이 스킬을 사용."
---

# Frontend AI Feature

도서 AI 추천 기능 구현 가이드.

## 파일 구조

```
src/
├── app/ai-recommend/page.tsx
├── components/ai/
│   ├── PreferenceForm.tsx    # 취향 입력 폼
│   └── RecommendList.tsx     # 추천 결과 목록
├── hooks/useBookRecommendation.ts
├── types/recommendation.ts
└── lib/mock/recommendation.ts
```

## 1. 타입 정의 (src/types/recommendation.ts)

백엔드 API 인터페이스를 먼저 확정한다. `any` 사용 금지 — 타입이 변경되면 이 파일만 수정한다.

```typescript
export interface UserPreference {
  genres: string[];        // 선호 장르 (복수, 최소 1개)
  mood: string;            // 현재 기분 (예: '설렘', '편안', '고민')
  recentBook?: string;     // 최근 읽은 책 제목 (선택)
}

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;          // 0~5
  thumbnailUrl?: string;
  reason: string;          // AI 추천 이유 (필수)
}

export interface RecommendationResponse {
  recommendations: BookRecommendation[];
  generatedAt: string;     // ISO 8601
}
```

## 2. Mock 데이터 (src/lib/mock/recommendation.ts)

실제 API와 동일한 인터페이스를 유지한다. 백엔드 완성 후 `fetchRecommendations` 구현만 교체하면 호출 코드는 변경 불필요.

```typescript
import type { UserPreference, RecommendationResponse } from '@/types/recommendation';

const MOCK_DATA: RecommendationResponse = {
  recommendations: [
    {
      id: '1', title: '채식주의자', author: '한강', genre: '소설',
      rating: 4.5, reason: '섬세한 심리 묘사가 현재 기분과 잘 맞습니다.'
    },
    {
      id: '2', title: '어린 왕자', author: '생텍쥐페리', genre: '소설',
      rating: 4.8, reason: '선호하신 철학적 요소가 담긴 고전입니다.'
    },
    {
      id: '3', title: '코스모스', author: '칼 세이건', genre: '과학',
      rating: 4.7, reason: 'SF 장르를 좋아하시면 이 책을 추천합니다.'
    },
  ],
  generatedAt: new Date().toISOString(),
};

export async function fetchRecommendations(
  _pref: UserPreference
): Promise<RecommendationResponse> {
  // 실제 API 호출 시 아래 줄을 교체한다:
  // return fetch('/api/recommendations', { method: 'POST', body: JSON.stringify(_pref) }).then(r => r.json())
  await new Promise(r => setTimeout(r, 900)); // API 지연 시뮬레이션
  return MOCK_DATA;
}
```

## 3. 훅 (src/hooks/useBookRecommendation.ts)

```typescript
import { useState } from 'react';
import type { UserPreference, RecommendationResponse } from '@/types/recommendation';
import { fetchRecommendations } from '@/lib/mock/recommendation';

export function useBookRecommendation() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommend = async (pref: UserPreference) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRecommendations(pref);
      setData(result);
    } catch {
      setError('추천 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setData(null); setError(null); };

  return { data, loading, error, recommend, reset };
}
```

## 4. PreferenceForm.tsx 구현 원칙

- 장르는 체크박스 멀티 선택 (GENRES 배열에서 렌더링, 최소 1개 선택 강제)
- 기분은 이모지 + 텍스트 버튼 선택 (예: `[😊 설렘]`, `[😌 편안]`, `[🤔 고민]`)
- 최근 읽은 책은 텍스트 input (선택 항목)
- 제출 시 `recommend(preference)` 호출
- `loading` 중에는 버튼 disabled + 스피너 표시

## 5. RecommendList.tsx 구현 원칙

- `BookCard` 컴포넌트(frontend-ui 제공)를 사용한다
  - `reason` prop에 `book.reason` 전달 (AI 추천 이유 표시)
- BookCard 미완성이면 임시 인라인 카드로 대체하고, 완성 알림 수신 후 교체
- `onClick`은 `router.push('/books/' + book.id)` 로 연결

## 6. 상태별 UI

| 상태 | UI 처리 |
|------|---------|
| 초기 | PreferenceForm만 표시, 결과 영역 숨김 |
| 로딩 | `<Skeleton variant="card" count={3} />` |
| 에러 | 에러 메시지 + "다시 시도" Button |
| 성공 (결과 있음) | BookCard 그리드 |
| 성공 (결과 없음) | "조건에 맞는 책을 찾지 못했습니다" + reset Button |

## 7. page.tsx 구조

```typescript
'use client';

export default function AIRecommendPage() {
  const { data, loading, error, recommend } = useBookRecommendation();

  return (
    <main>
      <h1>AI 도서 추천</h1>
      <PreferenceForm onSubmit={recommend} loading={loading} />
      <RecommendList data={data} loading={loading} error={error} />
    </main>
  );
}
```

## 주의사항

- `'use client'` 선언 필수 (useState 사용)
- `BookCard`의 `id`, `title`, `author`, `genre`, `rating` 은 required — mock 데이터에서 누락되지 않도록 한다
- href 링크는 `/books/${book.id}` 형식 (books 페이지는 frontend-ui가 구현)
