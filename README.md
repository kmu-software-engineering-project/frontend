# 도서 웹사이트 — 프론트엔드

Next.js 기반 도서 추천·검색·리뷰·도서관 위치 서비스 프론트엔드입니다.  
백엔드(Django)와 함께 동작하며, 외부 API 키는 Next.js API 라우트에서만 처리합니다.

---

## 기술 스택

| | |
|---|---|
| **프레임워크** | Next.js 16 (App Router) |
| **언어** | TypeScript 5 |
| **스타일** | Tailwind CSS 3 |
| **런타임** | Node.js / React 18 |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열고 아래 키를 채웁니다.

| 변수 | 설명 | 노출 범위 |
|------|------|-----------|
| `BACKEND_URL` | Django 백엔드 주소 (기본값: `http://localhost:8000`) | 서버 전용 |
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 — 도서 표지 검색 | 서버 전용 |
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 카카오 지도 SDK 앱 키 | 클라이언트 |
| `ALADIN_TTB_KEY` | 알라딘 Open API TTB 키 | 서버 전용 |
| `NL_SASEO_API_KEY` | 국립중앙도서관 서지 API 키 | 서버 전용 |
| `SEOUL_API_KEY` | 서울시 공공데이터 API 키 | 서버 전용 |

> `NEXT_PUBLIC_` 접두사가 없는 키는 브라우저에 절대 노출되지 않습니다.  
> 실제 키 값을 코드에 직접 작성하거나 git에 커밋하지 마세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인합니다.  
백엔드가 `http://localhost:8000`에서 실행 중이어야 추천·리뷰·도서관 기능이 동작합니다.

---

## 페이지

| URL | 설명 |
|-----|------|
| `/` | 홈 — 히어로 배너, 장르 바로가기, AI 추천 CTA |
| `/recommend` | AI 도서 추천 — 8단계 취향 설문 |
| `/recommend/result` | 추천 결과 — 5권 카드, 서점 가격 비교 |
| `/genres` | 장르 목록 |
| `/genres/[genre]` | 장르별 도서 목록 |
| `/books/[id]` | 도서 상세 |
| `/reviews` | 도서 검색 + 방명록형 리뷰 |
| `/libraries` | 도서관 위치 지도 (카카오맵) |

---

## API 라우트

외부 API 키는 서버에서만 사용합니다. 클라이언트는 아래 내부 라우트만 호출합니다.

| 라우트 | 메서드 | 외부 연동 |
|--------|--------|-----------|
| `/api/recommend` | POST | Django 추천 API |
| `/api/kakao-book` | GET | 카카오 책 검색 → 알라딘 fallback |
| `/api/bookstore-prices` | GET | Django 서점 가격 비교 API |
| `/api/books/search` | GET | 알라딘 검색 API |
| `/api/books/[id]` | GET | 도서 상세 |
| `/api/reviews` | GET / POST | Django 리뷰 API |
| `/api/reviews/[id]` | DELETE | Django 리뷰 삭제 |
| `/api/libraries` | GET | Django 도서관 목록 |
| `/api/saseo` | GET | 국립중앙도서관 서지 API |

---

## 주요 스크립트

```bash
npm run dev        # 개발 서버 실행 (포트 3000)
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run lint       # ESLint 검사
npx tsc --noEmit   # TypeScript 타입 체크 (PR 전 필수)
```

---

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/            # Next.js API 라우트 (서버 전용)
│   │   │   ├── recommend/
│   │   │   ├── kakao-book/
│   │   │   ├── bookstore-prices/
│   │   │   ├── books/
│   │   │   ├── reviews/
│   │   │   └── libraries/
│   │   ├── recommend/      # AI 추천 입력·결과 페이지
│   │   ├── genres/         # 장르 목록·상세 페이지
│   │   ├── reviews/        # 도서 검색 + 리뷰 페이지
│   │   ├── libraries/      # 도서관 지도 페이지
│   │   ├── books/[id]/     # 도서 상세 페이지
│   │   ├── layout.tsx      # 루트 레이아웃 (Header + Footer)
│   │   ├── globals.css     # 전역 스타일 + 유틸리티
│   │   └── page.tsx        # 홈
│   ├── components/         # 공통 컴포넌트 (BookCard, Header, Footer 등)
│   ├── lib/                # mock 데이터, 유틸 함수
│   └── types.ts            # 공유 타입 정의
├── docs/                   # 프로젝트 문서 (아키텍처, 스프린트 트래커)
├── _workspace/             # 설계·QA 산출물
├── .env.example            # 환경 변수 템플릿
└── CLAUDE.md               # 개발 규칙 (브랜치·보안·QA 게이트)
```

---

## 브랜치 및 커밋 규칙

```
main              — 배포 브랜치. 직접 push 금지, PR + 리뷰 필수
front/{작업명}    — 기능·수정 브랜치 (예: front/recommend-result, front/fix)
```

커밋 메시지 형식: `{type}: {설명}`

| 타입 | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `docs` | 문서 |
| `chore` | 빌드·설정 |

PR 전 체크리스트:
- [ ] `npx tsc --noEmit` 0 errors
- [ ] 브라우저 콘솔 에러 없음
- [ ] `.env.local` 미포함 확인

자세한 개발 규칙은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
