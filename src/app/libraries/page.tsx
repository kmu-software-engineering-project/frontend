import LibrariesMap from './LibrariesMap'
import { MOCK_LIBRARIES } from '@/lib/mock'

export default function LibrariesPage() {
  const mapApiKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? process.env.KAKAO_MAP_API_KEY

  return (
    <div className="page-shell py-12">
      <div className="mb-8 max-w-3xl">
        <p className="eyebrow">Library</p>
        <h1 className="mt-2 text-4xl font-light tracking-tight text-stone-950">가까운 도서관 찾기</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          지도에서 도서관 위치를 확인하고, 동네별 필터로 원하는 지역의 도서관 이름, 주소, 운영시간을 빠르게
          살펴볼 수 있습니다.
        </p>
      </div>

      <LibrariesMap libraries={MOCK_LIBRARIES} mapApiKey={mapApiKey} />
    </div>
  )
}
