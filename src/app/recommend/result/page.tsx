import Link from 'next/link'

// A 담당 영역 — 내부 AI 로직 구현 금지. Placeholder 페이지.
export default function RecommendResultPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-6">📋</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">추천 결과</h1>
      <p className="text-gray-500 mb-2">AI 추천 결과가 여기에 표시됩니다.</p>
      <p className="text-sm text-primary-600 font-medium mb-10">개발 중</p>
      <Link
        href="/recommend"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
      >
        ← 추천 입력으로 돌아가기
      </Link>
    </div>
  )
}
