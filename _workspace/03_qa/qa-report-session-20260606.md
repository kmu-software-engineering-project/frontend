---
name: qa-report-session-20260606
description: Sprint 6 QA — 서점 버튼 단일화·scrollbar-hide·normalizeLibrary 수정 종합 검증 (2026-06-06)
metadata:
  type: project
---

# QA 검증 리포트
검증 일시: 2026-06-06
검증 범위: Sprint 6 — 서점 버튼 단일화·scrollbar-hide·normalizeLibrary·인터파크 제외 수정

## 변경 사항 목록
1. `globals.css` — `@layer utilities`에 `.scrollbar-hide` 추가
2. `LibrariesMap.tsx:207` — aside에 `scrollbar-hide` 적용, `pr-1` 제거
3. `api/bookstore-prices/route.ts` — 신규 생성 (backend `/api/v1/bookstores/prices/` 프록시)
4. `recommend/result/page.tsx` — STORE_URLS 제거, `StoreEntry` 타입 추가, 단일 "서점에서 보기" 버튼, 인터파크 필터
5. `libraries/page.tsx` — `normalizeLibrary`에 `hours`, `closedDays` 필드 매핑 추가

## 요약
- ✅ 통과: 13항목
- ❌ 실패: 0항목

---

## 결과 상세

### A. TypeScript 타입 체크
결과: 통과

`npx tsc --noEmit` — 0 errors.

---

### B. result/page.tsx 구조 검증

**B-1. STORE_URLS 완전 제거**
결과: 통과

`src/` 전체 grep 결과 `STORE_URLS` 일치 없음. 잔여 참조 없음.

**B-2. StoreEntry 타입 선언**
결과: 통과

`result/page.tsx:23-27` — `{ store_name: string; price: number | null; purchase_url: string }` 3필드.

**B-3. loadStores — `storeStatus !== 'idle'` 가드**
결과: 통과

`result/page.tsx:94` — 함수 진입 첫 줄 중복 호출 방지 가드 존재.

**B-4. 인터파크 필터**
결과: 통과

`result/page.tsx:104` — `.filter((s) => s.store_name !== '인터파크')`.
API 응답에서 인터파크 항목 제외 후 `setStores` 호출.

**B-5. fetch('/api/bookstore-prices?...') 호출**
결과: 통과

`result/page.tsx:101` — URLSearchParams 조합 (`title`, 조건부 `author`, 조건부 `isbn`) 후 fetch.

---

### C. bookstore-prices 라우트 검증

**C-1. 파일 존재**
결과: 통과

`src/app/api/bookstore-prices/route.ts` 생성 확인.

**C-2. BACKEND_URL 환경 변수 사용**
결과: 통과

`route.ts:3` — `process.env.BACKEND_URL ?? 'http://localhost:8000'`. 하드코딩 없음.

**C-3. title 필수 파라미터 체크**
결과: 통과

`route.ts:8` — `if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })`.

**C-4. author, isbn 선택 파라미터 전달**
결과: 통과

`route.ts:12-15` — null 체크 후 `params.set()` 조건부 추가.

---

### D. scrollbar-hide 검증

**D-1. @layer utilities 내 .scrollbar-hide 정의**
결과: 통과

`globals.css:38-46` — `@layer utilities { .scrollbar-hide { ... } }` 구조 확인.

**D-2. 3가지 CSS 선언 포함**
결과: 통과

- `-ms-overflow-style: none` (IE/Edge)
- `scrollbar-width: none` (Firefox)
- `.scrollbar-hide::-webkit-scrollbar { display: none }` (Chrome/Safari/Opera)
3가지 모두 존재.

**D-3. aside 적용 및 pr-1 제거**
결과: 통과

`LibrariesMap.tsx:207` — `scrollbar-hide` 존재, `pr-1` grep 결과 없음.

---

### E. normalizeLibrary 검증

**E-1. hours, closedDays 필드 매핑**
결과: 통과

`libraries/page.tsx:42-43` — `hours: lib.hours as string | undefined`, `closedDays: lib.closedDays as string | undefined` 추가.

**E-2. Library 타입과 일치**
결과: 통과

`src/types.ts:29-30` — `hours?: string`, `closedDays?: string` optional 필드와 완전 일치.

---

## 종합 판정

| 항목 | 결과 |
|------|------|
| A. TypeScript 0 errors | ✅ |
| B-1. STORE_URLS 제거 | ✅ |
| B-2. StoreEntry 타입 | ✅ |
| B-3. loadStores 중복 가드 | ✅ |
| B-4. 인터파크 필터 | ✅ |
| B-5. /api/bookstore-prices 호출 | ✅ |
| C-1. 라우트 파일 존재 | ✅ |
| C-2. BACKEND_URL 환경 변수 | ✅ |
| C-3. title 필수 체크 | ✅ |
| C-4. 선택 파라미터 전달 | ✅ |
| D-1. scrollbar-hide 정의 위치 | ✅ |
| D-2. 3가지 CSS 선언 | ✅ |
| D-3. aside 적용 + pr-1 제거 | ✅ |
| E-1. hours/closedDays 매핑 | ✅ |
| E-2. Library 타입 일치 | ✅ |

실패 항목 없음. 배포 차단 이슈 없음.
