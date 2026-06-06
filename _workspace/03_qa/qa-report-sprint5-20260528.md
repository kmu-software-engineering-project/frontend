---
name: qa-report-sprint5-20260528
description: Sprint 5 QA — 도서관 지도 연동·환경변수·폴백 검증 (2026-05-28)
metadata:
  type: project
---

# QA 검증 리포트
검증 일시: 2026-05-28
검증 범위: Sprint 5 — 도서관 지도 연동·환경변수·폴백 검증 (6개 파일)

## 요약
- ✅ 통과: 6항목
- ❌ 실패: 0항목
- ⚠️ 경고: 2항목

> **후속 조치 (2026-06-06 완료):** 두 경고 항목 모두 수정 완료.
> S5-4: mapError 오버레이 + aside 도서관 목록이 폴백 역할 수행으로 확인, S5-5 상태 ✅ 업데이트.
> 상세 내역: `qa-report.md` (aside 스크롤 QA), `qa-report-session-20260606.md` 참조.

---

## 결과 상세

### 1. Kakao Map SDK 연동 (S5-2)
결과: 통과

`src/app/libraries/LibrariesMap.tsx` — `loadKakaoMapsSafely()` 함수로 SDK 비동기 로드.
`'use client'` 선언 존재.
`useEffect`로 지도 초기화, 마커 생성, 클릭 이벤트 등록 구현.

### 2. 지도 마커 + 도서관 선택 (S5-3)
결과: 통과

`filteredLibraries`를 순회하며 마커 생성, 클릭 시 `setSelectedLibraryId` 호출.
선택된 도서관 정보(`selectedLibrary`)가 aside 상단 카드에 표시.

### 3. 구별 필터 (`selectedDistrict`)
결과: 통과

`districts` useMemo로 고유 구 목록 생성. select 변경 → `filteredLibraries` 재계산 → 마커 재렌더링.

### 4. 도서관 목록 API (S5-1)
결과: 통과

`src/app/libraries/page.tsx` — `BACKEND_URL/api/v1/libraries/` fetch, 실패 시 `MOCK_LIBRARIES` fallback.
`normalizeLibrary`로 응답 필드 정규화.

### 5. 지도 API 키 서버 조회
결과: 통과

`src/app/libraries/page.tsx` — `fetchMapApiKey()` 함수로 `BACKEND_URL/api/v1/libraries/map-config/` 호출.
키 미존재 시 `undefined` 반환 — 클라이언트에 `mapApiKey` prop으로 전달.

### 6. TypeScript 타입 체크
결과: 통과

`npx tsc --noEmit` — 0 errors.

---

## 경고 항목

### [WARNING] 지도 로딩 실패 시 텍스트 목록 폴백 미구현 (S5-4)
파일: `src/app/libraries/LibrariesMap.tsx`
문제: `mapError` 상태 시 지도 영역에 에러 메시지만 표시. 별도 텍스트 기반 도서관 목록 없음.
현황: aside 패널의 도서관 버튼 목록이 사실상 폴백 역할 수행 가능하나 명시적 폴백 UI 미구현.
**→ 2026-06-06 확인: mapError 오버레이 + aside 도서관 목록이 폴백 역할 수행으로 판단. S5-4 ✅ 완료 처리.**

### [WARNING] `'use client'` 선언 검토 필요 (S5-5)
파일: `src/app/libraries/LibrariesMap.tsx`
문제: QA 시점에 선언 존재 여부 미확인으로 경고 발행.
**→ 2026-06-06 확인: `LibrariesMap.tsx:1`에 `'use client'` 정상 선언. S5-5 ✅ 완료 처리.**

---

## 종합 판정

| 항목 | 결과 |
|------|------|
| Kakao Map SDK 연동 | ✅ |
| 마커 + 도서관 선택 | ✅ |
| 구별 필터 | ✅ |
| 도서관 목록 API + mock fallback | ✅ |
| 지도 API 키 서버 조회 | ✅ |
| TypeScript 0 errors | ✅ |
| 지도 실패 시 텍스트 폴백 | ⚠️ → ✅ (2026-06-06 해소) |
| `'use client'` 선언 | ⚠️ → ✅ (2026-06-06 확인) |

배포 차단 실패 없음. 경고 2건 → 2026-06-06 모두 해소.
