import Link from 'next/link'
import BookCard from '@/components/BookCard'
import { MOCK_BOOKS, MOCK_REVIEWS, GENRES } from '@/lib/mock'

const GENRE_ICONS: Record<string, string> = {
  소설: '📖',
  인문: '🧠',
  과학: '🔭',
  역사: '🏛️',
  자기계발: '🌱',
  예술: '🎨',
  경제: '💰',
  기타: '📚',
}

export default function HomePage() {
  const topBooks = [...MOCK_BOOKS].sort((a, b) => b.rating - a.rating).slice(0, 4)
  const recentReviews = MOCK_REVIEWS.slice(0, 2)

  return (
    <div className="min-h-full">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
          <p className="text-primary-200 text-sm font-medium tracking-widest uppercase">
            AI 도서 추천 서비스
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            당신을 위한 책,
            <br />
            AI가 찾아드립니다
          </h1>
          <p className="text-primary-200 text-lg max-w-md">
            원하는 장르와 분위기를 알려주면 딱 맞는 책을 추천해 드려요.
          </p>
          <div className="flex gap-3 mt-2">
            <Link
              href="/recommend"
              className="px-8 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
            >
              AI 추천 시작하기 →
            </Link>
            <Link
              href="/genres"
              className="px-8 py-3 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              장르 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* 장르 바로가기 */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="section-title">장르별 도서</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {GENRES.map((genre) => (
            <Link
              key={genre}
              href={`/genres?genre=${encodeURIComponent(genre)}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl">{GENRE_ICONS[genre]}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700">
                {genre}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 인기 도서 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">인기 도서</h2>
            <Link href="/genres" className="text-sm text-primary-600 hover:underline font-medium">
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* 최신 리뷰 미리보기 */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">최신 리뷰</h2>
          <Link href="/reviews" className="text-sm text-primary-600 hover:underline font-medium">
            전체 보기 →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {recentReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{review.bookTitle}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{review.author}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>
              <p className="text-xs text-gray-400 mt-4">{review.createdAt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI 추천 CTA */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">어떤 책을 읽어야 할지 모르겠나요?</h2>
          <p className="text-gray-600 mb-6">
            AI에게 원하는 분위기와 장르를 알려주세요. 딱 맞는 책 5권을 추천해 드립니다.
          </p>
          <Link
            href="/recommend"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            AI 추천 받기 →
          </Link>
        </div>
      </section>
    </div>
  )
}
