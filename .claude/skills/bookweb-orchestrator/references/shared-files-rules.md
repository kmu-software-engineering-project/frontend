# 공통 파일 수정 규칙

두 프론트엔드 개발자(A, B)가 동일 저장소에서 동시에 작업할 때 충돌을 방지하기 위한 파일 소유권 규칙.

## 소유권 테이블

| 파일 / 디렉토리 | 소유자 | 설명 |
|---------------|--------|------|
| `package.json`, `package-lock.json` | **B** | 모든 패키지 설치/제거는 B가 처리 |
| `src/app/layout.tsx` | **B** | Root Layout. A는 `src/app/ai-recommend/layout.tsx`로 분리 |
| `App.tsx` (CRA/Vite) | **B** | 라우터 설정, 전역 Provider |
| `src/app/globals.css` / `global.css` | **B** | 전역 CSS 변수, 기본 스타일 |
| `tailwind.config.ts` | **B** | 디자인 토큰 (색상, 폰트, 간격) |
| `tsconfig.json` | **B** | 경로 별칭, 컴파일러 옵션 |
| `next.config.ts` | **B** | Next.js 설정 |
| `src/components/common/*` | **B** | BookCard, Button 등 공통 컴포넌트 |
| `src/types/book.ts`, `review.ts`, `library.ts` | **B** | 공유 도메인 타입 |
| `src/lib/mock/books.ts`, `reviews.ts`, `libraries.ts` | **B** | B 담당 도메인 mock |
| `src/app/ai-recommend/*` | **A** | AI 추천 페이지 전체 |
| `src/components/ai/*` | **A** | AI 추천 전용 컴포넌트 |
| `src/hooks/useBookRecommendation.ts` | **A** | 추천 훅 |
| `src/types/recommendation.ts` | **A** | 추천 타입 |
| `src/lib/mock/recommendation.ts` | **A** | 추천 mock |

## 충돌 방지 프로토콜

### 1. 상대방 파일은 직접 수정하지 않는다

A가 B 소유 파일(예: `BookCard.tsx`, `globals.css`)을 수정해야 하면:
1. A → B: SendMessage로 **정확한 변경 내용** 전달
   - 예: `"BookCard에 reason?: string prop 추가 필요. RecommendList에서 AI 이유 표시용."`
2. B가 수정 후 A에게 완료 알림
3. A는 알림 수신 후 코드 연결

### 2. package.json 변경 절차

1. A가 패키지 필요 시 B에게 SendMessage: `"패키지명@버전 설치 필요, 이유: ..."`
2. B가 `npm install 패키지명@버전` 실행
3. B가 A에게 알림: `"설치 완료. package.json 업데이트됨. git pull 후 진행."`
4. A가 `git pull` 후 작업 재개

### 3. globals.css / tailwind.config 변경 절차

A가 전역 스타일(색상 변수, 폰트 등)이 필요하면:
- **옵션 1 (권장)**: Tailwind 유틸리티 클래스를 인라인으로 사용 — 전역 파일 수정 불필요
- **옵션 2**: B에게 SendMessage로 CSS 변수 추가 요청 → B가 처리

### 4. 공통 컴포넌트 props 변경 절차

B가 `BookCard`, `Button` 등의 인터페이스를 변경해야 하면:
1. B → A: SendMessage로 **변경 예정 내용과 영향 범위** 사전 알림
   - 예: `"BookCard에서 thumbnailUrl을 coverUrl로 이름 변경 예정. RecommendList.tsx 영향 받음."`
2. A가 수신 확인 후 B가 변경
3. B → A: 변경 완료 알림
4. A가 사용처 일괄 수정

### 5. 공유 타입(book.ts) 변경 절차

A가 `Book` 타입에 필드 추가가 필요하면:
1. A → B: SendMessage로 추가할 필드와 타입 전달
   - 예: `"Book 타입에 recommendationReason?: string 필드 추가 필요"`
2. B가 `book.ts` 수정 후 A에게 알림

## 디렉토리 분리 요약

```
src/
├── app/
│   ├── layout.tsx          ← B 전담 (A 수정 불가)
│   ├── globals.css         ← B 전담 (A 수정 불가)
│   ├── ai-recommend/       ← A 전담 (B 수정 불가)
│   └── [나머지 페이지]/     ← B 전담
├── components/
│   ├── common/             ← B 전담 (A는 import만)
│   └── ai/                 ← A 전담 (B 수정 불가)
├── types/
│   ├── recommendation.ts   ← A 전담
│   └── [나머지].ts          ← B 전담
└── lib/mock/
    ├── recommendation.ts   ← A 전담
    └── [나머지].ts          ← B 전담
```

## 오케스트레이터 체크포인트

Phase 3 팀 조율 시 리더는 아래 충돌 신호를 모니터링한다:
- 두 에이전트가 같은 파일을 동시에 수정하려는 경우
- B의 공통 컴포넌트 변경이 A의 작업 진행을 차단하는 경우
- 패키지 설치 요청이 처리되지 않아 A가 블로킹된 경우

충돌 감지 시 해당 에이전트에게 SendMessage로 중재한다.
