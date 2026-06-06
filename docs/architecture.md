# Architecture — 도서 웹사이트 프론트엔드

> 설계 변경 시 이 문서를 함께 갱신한다. (Docs as Code)

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.x |
| 언어 | TypeScript | 5.x |
| 스타일 | Tailwind CSS | 3.4 |
| 런타임 | Node.js | LTS |
| 배포 대상 | AWS EC2 | Sprint 1 선배포 예정 |
| 백엔드 | Django REST Framework | 별도 레포 |
| AI 엔진 | OpenAI GPT-4o | 백엔드에서 호출 |

---

## 시스템 아키텍처

```
사용자 브라우저
      │
      ▼
┌─────────────────────────────────────────┐
│          Next.js (App Router)           │
│                                         │
│  Pages          API Routes (서버 사이드)│
│  /recommend ──▶ /api/recommend ─────────┼──▶ Django Backend
│  /genres    ──▶ /api/saseo ─────────────┼──▶ 국립중앙도서관 API
│  /reviews   ──▶ /api/reviews ───────────┼──▶ Django Backend
│  /libraries ──▶ /api/libraries ─────────┼──▶ 서울시 공공데이터
│  /result    ──▶ /api/kakao-book ────────┼──▶ Kakao Book Search
│             └─▶ /api/kakao-book ────────┼──▶ Aladin API (fallback)
│                                         │
└─────────────────────────────────────────┘
      │
      │ (클라이언트 직접)
      ▼
   Kakao Map SDK (도서관 지도)
```

**원칙:** 서버 API 키가 필요한 외부 서비스는 반드시 Next.js API Route를 통해 프록시한다.  
클라이언트에서 서버 키를 직접 호출하지 않는다.

---

## 페이지 라우팅

| URL | 페이지 | 담당 에이전트 | 상태 |
|-----|--------|-------------|------|
| `/` | 홈 (히어로 배너, CTA) | frontend-ui (B) | ✅ 구현 |
| `/recommend` | AI 추천 입력 폼 (8단계) | frontend-ai (A) | ✅ 구현 |
| `/recommend/result` | 추천 결과 (5권 카드 + 팝업) | frontend-ai (A) | ✅ 구현 |
| `/genres` | 장르별 도서 목록 | frontend-ui (B) | ✅ 구현 |
| `/genres/[genre]` | 장르 상세 (동적 라우팅) | frontend-ui (B) | ✅ 구현 |
| `/books/[id]` | 도서 상세 | frontend-ui (B) | ✅ 구현 |
| `/reviews` | 도서 검색 + 리뷰 | frontend-ui (B) | ✅ 구현 |
| `/libraries` | 도서관 위치 지도 | frontend-ui (B) | ✅ 구현 |

---

## 외부 API 연동 현황

| API | 용도 | 환경 변수 | Next.js 라우트 | 비고 |
|-----|------|-----------|--------------|------|
| Django 백엔드 | AI 추천 결과 반환 | `BACKEND_URL` | `/api/recommend` | GPT-4o 사용 |
| Kakao Book Search | 도서 표지·설명 (1순위) | `KAKAO_REST_API_KEY` | `/api/kakao-book` | |
| Aladin Open API | 도서 표지·설명 (2순위 fallback) | `ALADIN_TTB_KEY` | `/api/kakao-book` | HTTP→HTTPS 변환 |
| 국립중앙도서관 서지 | 장르별 도서 목록 | `NL_SASEO_API_KEY` | `/api/saseo` | |
| 서울시 공공데이터 | 도서관 위치 정보 | `SEOUL_API_KEY` | `/api/libraries` | |
| Kakao Map SDK | 도서관 지도 렌더링 | `KAKAO_MAP_API_KEY` | 클라이언트 직접 | Script 태그 |

---

## AI 추천 데이터 흐름

```
① 사용자: 8단계 설문 폼 응답
         ↓ (URL 쿼리 파라미터)
② /recommend/result 페이지 로드
         ↓ POST /api/recommend
③ Next.js API 라우트:
   - 한국어 레이블 → 영어 코드 변환 (FICTION/NONFICTION, 장르 etc.)
         ↓ POST {BACKEND_URL}/api/v1/recommendations/
④ Django + GPT-4o:
   - 추천 도서 5권 반환 (title, author, reason)
         ↓ 병렬로 (Promise.all)
⑤ 각 도서별 GET /api/kakao-book?q={title}
   - Kakao 성공 → thumbnail + description 반환
   - Kakao 실패 → Aladin 검색 fallback
   - 둘 다 실패 → null (그라디언트 썸네일 사용)
         ↓
⑥ 5권 카드 그리드 렌더링
⑦ 카드 클릭 → BookModal 팝업
   - 도서 표지 (Kakao/Aladin/그라디언트)
   - 설명 (Kakao/Aladin)
   - AI 추천 근거 (reason)
   - 외부 링크: 교보문고 / Yes24 / 알라딘
```

---

## 컴포넌트 구조 (공통)

```
BookCard            — 도서 카드 (variant: default | compact)
  props: book, reason?, variant?, onClick?
Button              — 버튼 (variant: primary | secondary | outline | ghost)
Header              — GNB (네비게이션 5개 링크)
Footer              — 푸터
Skeleton            — 스켈레톤 로딩
HomeLiveSections    — 홈 페이지 섹션 (히어로, 장르, CTA)
```

---

## 디자인 시스템

Tailwind CSS 커스텀 토큰 (`tailwind.config.ts`):

| 토큰 | 설명 | 용도 |
|------|------|------|
| `primary-*` | 따뜻한 브라운 (50~900) | 강조, 버튼, 링크 |
| `secondary-*` | 중간 브라운 (50~900) | 보조 강조 |
| `stone-*` | Tailwind 기본 stone | 텍스트, 배경 |
| `shadow-soft` | 0 18px 60px rgba(66,52,35,0.10) | 카드 그림자 |
| Font | Pretendard | 전체 본문 |

반응형 breakpoint: 375px (mobile) / 768px (tablet) / 1280px (desktop)

---

## 향후 개선 사항

- [ ] 테스트 환경 설정 (Vitest 또는 Jest + MSW)
- [ ] Pre-commit 훅 설정 (lint-staged + Husky)
- [ ] GitHub Actions CI 워크플로 (tsc + lint on PR)
- [ ] AWS EC2 배포 자동화 (Sprint 6)
- [ ] `next/image` 전환 (현재 `<img>` 직접 사용)
