import Link from 'next/link'

// A 담당 영역 — 내부 AI 로직 구현 금지. Placeholder 페이지.
export default function RecommendPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-6">🤖</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">AI 도서 추천</h1>
      <p className="text-gray-500 mb-2">
        원하는 장르와 분위기를 입력하면 AI가 딱 맞는 책을 추천해 드립니다.
      </p>
      <p className="text-sm text-primary-600 font-medium mb-10">개발 중 — 곧 만나요!</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
      >
        ← 홈으로 돌아가기
      </Link>
    </div>
  )
}
