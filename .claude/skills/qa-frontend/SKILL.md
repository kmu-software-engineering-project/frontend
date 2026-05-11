---
name: qa-frontend
description: "도서 웹사이트 프론트엔드 통합 정합성 QA 검증. mock↔훅 타입 교차 검증, href↔파일 경로 매핑, BookCard props 불일치 탐지, 디자인 시스템 준수 확인. 'QA', '통합 테스트', '버그 검증', '배포 전 점검', '정합성 확인', 'QA 재실행' 요청 시 반드시 이 스킬을 사용."
---

# QA Frontend

도서 웹사이트 프론트엔드 통합 정합성 검증 가이드.

## 검증 원칙: "양쪽 동시 읽기"

경계면 버그는 한쪽만 읽으면 잡히지 않는다. 반드시 생산자와 소비자를 동시에 열어 비교한다.

## 검증 체크리스트

### 1. 데이터 타입 ↔ 훅 정합성

각 mock 함수와 대응 훅의 타입을 교차 비교한다:

| 훅 파일 | Mock 함수 | 검증 포인트 |
|--------|-----------|------------|
| `useBookRecommendation` | `fetchRecommendations` | 반환 `RecommendationResponse` ↔ 훅 상태 타입 |
| `useGenres` (또는 장르 page) | `fetchBooksByGenre` | 반환 `Book[]` ↔ 사용처 타입 |
| `useReviews` | `fetchReviews` | 반환 `Review[]` ↔ 사용처 타입 |
| `useLibraries` | `fetchLibraries` | 반환 `Library[]` ↔ 사용처 타입 |

```
검증 절차:
1. src/lib/mock/*.ts 의 반환 타입 확인
2. 대응 훅 또는 컴포넌트의 타입 파라미터 확인
3. shape 일치 여부 비교 (필드명, optional 여부 포함)
```

### 2. BookCard props 정합성 (핵심)

BookCard는 두 개발자가 공유한다. 불일치가 가장 빈번하다.

```
검증 절차:
1. src/components/common/BookCard.tsx 의 Props 인터페이스 읽기
2. frontend-ai 사용처: src/components/ai/RecommendList.tsx
3. frontend-ui 사용처: src/app/genres/[genre]/page.tsx, src/app/reviews/page.tsx 등
4. 각 사용처에서 required props(id, title, author, genre, rating)가 모두 전달되는지 확인
5. reason prop이 RecommendList.tsx에서만 전달되는지 확인 (optional)
```

### 3. 라우팅 정합성

```
검증 절차:
1. src/app/ 하위 page.tsx 파일 경로에서 URL 패턴 추출
   - [genre] → 동적 세그먼트 (encodeURIComponent 처리 여부 확인)
   - [id] → 동적 세그먼트
2. 코드 내 모든 href, <Link href>, router.push 값 수집 (Grep 활용)
3. 각 값이 실제 page 경로와 매칭되는지 확인
```

**이 프로젝트에서 자주 틀리는 패턴:**

| 잘못된 예 | 올바른 예 |
|----------|---------|
| `/ai_recommend` | `/ai-recommend` |
| `/genre/${genre}` | `/genres/${encodeURIComponent(genre)}` |
| `/book/${id}` | `/books/${id}` |
| `/library` | `/libraries` |

Header 네비게이션 링크가 실제 경로와 일치하는지 반드시 확인한다.

### 4. 디자인 시스템 준수

`_workspace/01_design/design-system.md`와 실제 코드를 비교:

- CSS 변수(`--color-primary` 등)가 실제로 사용되거나 Tailwind config에 반영되어 있는지
- `--font-heading`(Noto Serif KR)이 제목에, `--font-body`(Noto Sans KR)이 본문에 적용되는지
- BookCard hover 효과가 design-system.md 스펙(`shadow-card-hover`, `translateY(-2px)`)과 일치하는지
- `component-specs.md`의 Button variants(primary/secondary/ghost)가 모두 구현되어 있는지

### 5. 기술적 체크

- [ ] `'use client'` 선언: Header(상태 있음), 지도 컴포넌트, PreferenceForm, useBookRecommendation 사용 컴포넌트
- [ ] 환경 변수: `libraries/page.tsx`에서 `process.env.NEXT_PUBLIC_MAP_API_KEY` 참조 (미설정 시 폴백 존재)
- [ ] `any` 타입 사용 여부: `Grep "as any\|: any"` 로 검색
- [ ] 내부 링크에 `<a>` 태그 대신 `<Link>` 사용 여부
- [ ] 이미지 `alt` 속성 존재 여부 (접근성)
- [ ] `fetchBooksByGenre`에서 `decodeURIComponent(genre)` 처리 여부

## QA 리포트 형식

`_workspace/03_qa/qa-report.md`에 작성:

```markdown
# QA 검증 리포트
검증 일시: YYYY-MM-DD HH:MM

## 요약
- ✅ 통과: N항목
- ❌ 실패: N항목
- ⚠️ 미검증: N항목

## 실패 항목

### [CRITICAL] BookCard props 불일치
파일: `src/components/ai/RecommendList.tsx:45`
문제: `rating` prop 미전달 (BookCard Props에 required)
수정: `<BookCard ... rating={book.rating} />`
담당: frontend-ai

### [WARNING] 지도 API 키 폴백 미구현
파일: `src/app/libraries/page.tsx`
문제: NEXT_PUBLIC_MAP_API_KEY 미설정 시 에러 발생
수정: 키 미존재 조건 분기 + 텍스트 목록 폴백 추가
담당: frontend-ui

## 통과 항목
- ✅ 라우팅: 모든 href가 실제 page 경로와 일치
- ✅ useBookRecommendation 반환 타입 일치
- ...

## 미검증 항목
- ⚠️ 도서관 지도 렌더링: 환경 변수 미설정으로 미확인
```

## 점진적 QA (권장 실행 타이밍)

전체 완성 후 1회가 아니라 각 모듈 완성 직후 실행한다:

1. **공통 컴포넌트 완성 후** → BookCard props 계약 검증 (3번 체크리스트)
2. **AI 추천 페이지 완성 후** → 훅 타입 + BookCard 사용처 검증 (1, 2번)
3. **나머지 페이지 완성 후** → 라우팅 정합성 + 디자인 시스템 검증 (3, 4번)
4. **전체 완성 후** → 전체 체크리스트 실행 + 종합 리포트 생성
