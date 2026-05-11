import { MOCK_LIBRARIES } from '@/lib/mock'

export default function LibrariesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="section-title">도서관 찾기</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <span className="text-xl shrink-0">🗺️</span>
        <div>
          <p className="text-sm font-medium text-amber-800">지도 기능 준비 중</p>
          <p className="text-xs text-amber-700 mt-0.5">
            지도 API 연동 후 위치를 지도에서 확인할 수 있습니다. 현재는 목록으로 제공됩니다.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_LIBRARIES.map((lib) => (
          <div
            key={lib.id}
            className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:border-primary-200 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🏛️</span>
              <div>
                <h3 className="font-semibold text-gray-900">{lib.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{lib.address}</p>
                {lib.phone && (
                  <p className="text-sm text-primary-600 mt-1 font-medium">{lib.phone}</p>
                )}
                {lib.lat && lib.lng && (
                  <p className="text-xs text-gray-400 mt-2">
                    위도 {lib.lat.toFixed(4)} / 경도 {lib.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
