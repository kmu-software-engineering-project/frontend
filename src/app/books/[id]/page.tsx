import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getBookById, getReviewsByBookId } from '@/lib/mock'

interface Props {
  params: { id: string }
}

export default function BookDetailPage({ params }: Props) {
  const book = getBookById(params.id)
  if (!book) notFound()

  const reviews = getReviewsByBookId(book.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* 도서 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-8 mb-10">
        <div className="relative w-40 h-56 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 mx-auto md:mx-0">
          {book.thumbnailUrl ? (
            <Image
              src={book.thumbnailUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">
              📖
            </div>
          )}
        </div>
        <div className="flex-1">
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
            {book.genre}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{book.title}</h1>
          <p className="text-gray-600 mb-3">{book.author}</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < Math.round(book.rating) ? 'text-yellow-400' : 'text-gray-200'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{book.rating.toFixed(1)}</span>
          </div>
          {book.description && (
            <p className="text-gray-700 leading-relaxed text-sm">{book.description}</p>
          )}
          {book.publishedYear && (
            <p className="text-xs text-gray-400 mt-3">출판연도: {book.publishedYear}</p>
          )}
        </div>
      </div>

      {/* 리뷰 섹션 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          리뷰 {reviews.length > 0 && <span className="text-primary-600">({reviews.length})</span>}
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900">{review.author}</p>
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs text-gray-400">{review.createdAt}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">아직 리뷰가 없습니다.</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/genres" className="text-sm text-primary-600 hover:underline">
          ← 도서 목록으로
        </Link>
      </div>
    </div>
  )
}
