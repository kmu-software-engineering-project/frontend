import Link from 'next/link'
import { MOCK_REVIEWS } from '@/lib/mock'

export default function ReviewsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="section-title">도서 리뷰</h1>
      <div className="space-y-4">
        {MOCK_REVIEWS.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link
                  href={`/books/${review.bookId}`}
                  className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {review.bookTitle}
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">{review.author}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
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
    </div>
  )
}
