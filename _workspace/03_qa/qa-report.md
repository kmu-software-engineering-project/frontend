# QA 검증 리포트
검증 일시: 2026-06-06
검증 범위: libraries 페이지 aside 스크롤 수정 (`max-h-[33rem] overflow-y-auto pr-1`)

## 요약
- 통과: 8항목
- 실패: 0항목
- 경고: 1항목

---

## 결과 상세

### A. TypeScript 타입 체크
결과: 통과

`npx tsc --noEmit` 실행 결과 출력 없음 (0 errors).

---

### B. 변경 내용 정합성

**B-1. aside 클래스 확인**
결과: 통과

`src/app/libraries/LibrariesMap.tsx:207`
```
<aside className="space-y-4 max-h-[33rem] overflow-y-auto pr-1">
```
`max-h-[33rem]`, `overflow-y-auto`, `pr-1` 세 클래스가 모두 정확히 추가되어 있다.

**B-2. section(지도 섹션) 변경 여부 확인**
결과: 통과

`src/app/libraries/LibrariesMap.tsx:197-205`의 `<section>` 내 지도 컨테이너(`<div ref={mapContainerRef} style={{ width: '100%', height: '28rem' }}`)는 변경되지 않았다. `</section>` 닫힘 태그(205번째 줄) 이후에 `<aside>`가 시작되며 경계가 명확하다.

---

### C. Library 타입 ↔ 데이터 정합성

**C-1. Library 타입 필드 (`src/types.ts`)**
결과: 통과

```
id: string
name: string
address: string
neighborhood: string
hours?: string
closedDays?: string
phone?: string
homepage?: string
lat?: number
lng?: number
```

**C-2. MOCK_LIBRARIES shape (`src/lib/mock.ts:127-194`)**
결과: 통과

모든 mock 항목이 `Library` 인터페이스를 직접 타입으로 선언(`MOCK_LIBRARIES: Library[]`)하며, 필수 필드(`id`, `name`, `address`, `neighborhood`) 및 선택 필드(`hours`, `closedDays`, `phone`, `lat`, `lng`) 모두 인터페이스와 일치한다.

**C-3. normalizeLibrary 반환 타입 정합성 (`src/app/libraries/page.tsx:31-45`)**
결과: 통과 (경고 1건)

반환 타입 선언 `Library`와 실제 반환 객체의 필수 필드(`id`, `name`, `address`, `neighborhood`)는 모두 포함되어 있다. TypeScript 오류 없음.

경고: `normalizeLibrary`가 `Library` 타입의 선택 필드인 `hours`, `closedDays`를 반환 객체에 매핑하지 않는다. 백엔드 API 응답에 해당 필드가 포함되더라도 클라이언트에 전달되지 않는다. 선택 필드이므로 타입 오류는 없으나 기능상 데이터 손실이 발생할 수 있다. 수정 방법: `normalizeLibrary` 반환 객체에 `hours: lib.hours as string | undefined, closedDays: lib.closedDays as string | undefined` 추가 권장.

---

### D. 라우팅 정합성

**D-1. Header `/libraries` 링크**
결과: 통과

`src/components/Header.tsx:10` — `{ href: '/libraries', label: 'Library' }` 가 `src/app/libraries/page.tsx` 파일 경로와 정확히 일치한다.

**D-2. Footer `/libraries` 링크**
결과: 통과

`src/components/Footer.tsx:33` — `<Link href="/libraries">` 확인. 실제 경로와 일치.

**D-3. 내부 링크 전수 grep 결과**
`/libraries` 경로로의 링크: Header, Footer 2개소. 두 곳 모두 Next.js `<Link>` 컴포넌트를 사용하며 `<a href>` 직접 사용 없음.

---

### E. 기술적 체크

**E-1. `'use client'` 선언 여부**
결과: 통과

`src/app/libraries/LibrariesMap.tsx:1` — `'use client'` 선언 확인. `useEffect`, `useRef`, `useState`, `useMemo` 등 클라이언트 훅 사용에 대해 필수 선언이 존재한다.

**E-2. `any` 타입 사용 여부**
결과: 통과

`LibrariesMap.tsx` 내 `any` 타입 사용 없음. 카카오 지도 SDK 타입은 `KakaoLatLng = unknown`, `KakaoMap`, `KakaoMarker` 등 명시적 타입으로 정의되어 있다.

---

## 종합 판정

| 항목 | 결과 |
|------|------|
| A. TypeScript 타입 체크 | 통과 |
| B-1. aside 클래스 추가 확인 | 통과 |
| B-2. section 미변경 확인 | 통과 |
| C-1. Library 타입 필드 | 통과 |
| C-2. MOCK_LIBRARIES shape | 통과 |
| C-3. normalizeLibrary 반환 타입 | 통과 (경고) |
| D-1. Header 라우팅 | 통과 |
| D-2. Footer 라우팅 | 통과 |
| E-1. `'use client'` 선언 | 통과 |
| E-2. `any` 타입 | 통과 |

실패 항목 없음. 배포 차단 이슈 없음.
