'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type BookDetail = {
  id: string
  itemId: number | null
  title: string
  author: string
  publisher: string
  publishedAt: string
  description: string
  thumbnailUrl: string
  url: string
  isbn: string
  isbn13: string
  genre: string
  categoryName: string
  rating: number | null
  reviewCount: number | null
  bestRank: number | null
}

type BookResponse = {
  book?: BookDetail
  error?: string
}

type ReaderReview = {
  id: string
  bookId: string
  nickname: string
  password: string
  rating: number
  comment: string
  createdAt: string
}

const REVIEW_STORAGE_KEY = 'book-search-reviews'

function formatDate(value: string) {
  if (!value) return '날짜 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

function readReviews() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? '[]') as ReaderReview[]
  } catch {
    return []
  }
}

function StarRating({ rating }: { rating: number | null }) {
  const filled = rating ? Math.round(rating) : 0
  return (
    <div className="flex items-center gap-0.5" aria-label={rating ? `평점 ${rating.toFixed(1)}점` : '평점 없음'}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < filled ? 'text-primary-700' : 'text-stone-300'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function BookDetailPage() {
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<BookDetail | null>(null)
  const [reviews, setReviews] = useState<ReaderReview[]>([])
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  useEffect(() => {
    setReviews(readReviews())

    async function loadBook() {
      setIsLoading(true)
      setError(null)
      setErrorStatus(null)

      try {
        const response = await fetch(`/api/books/${encodeURIComponent(bookId)}`, {
          cache: 'no-store',
        })
        const data = (await response.json()) as BookResponse
        if (!response.ok) {
          setErrorStatus(response.status)
          throw new Error(data.error ?? '도서 정보를 불러오지 못했습니다.')
        }
        setBook(data.book ?? null)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : '도서 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadBook()
  }, [bookId])

  useEffect(() => {
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews))
  }, [reviews])

  const bookReviews = useMemo(() => {
    if (!book) return []
    return reviews
      .filter((review) => review.bookId === book.id)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
  }, [book, reviews])

  const averageRating = useMemo(() => {
    if (bookReviews.length === 0) return book?.rating ?? null
    return bookReviews.reduce((sum, review) => sum + review.rating, 0) / bookReviews.length
  }, [book?.rating, bookReviews])

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!book || !nickname.trim() || !password.trim() || !comment.trim()) return

    const nextReview: ReaderReview = {
      id: `${book.id}-${Date.now()}`,
      bookId: book.id,
      nickname: nickname.trim(),
      password: password.trim(),
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    }

    setReviews((currentReviews) => [nextReview, ...currentReviews])
    setNickname('')
    setPassword('')
    setRating(5)
    setComment('')
  }

  if (isLoading) {
    return (
      <div className="page-shell py-12">
        <div className="h-96 animate-pulse rounded-lg bg-white/60" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="page-shell py-12">
        <Link href="/" className="text-sm font-medium text-stone-600 hover:text-primary-700">
          홈으로 돌아가기
        </Link>
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorStatus === 500 ? (
            <>
              {error ?? '도서 정보를 불러오지 못했습니다.'} 환경 변수 <span className="font-semibold">ALADIN_TTB_KEY</span>를 확인해 주세요.
            </>
          ) : (
            error ?? '도서를 찾을 수 없습니다.'
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell py-12">
      <Link href="/" className="mb-8 inline-flex text-sm font-medium text-stone-600 hover:text-primary-700">
        홈으로 돌아가기
      </Link>

      <section className="grid gap-8 rounded-lg border border-stone-900/10 bg-white/70 p-6 shadow-sm md:grid-cols-[13rem_1fr] md:p-8">
        <div className="relative mx-auto aspect-[3/4] w-52 overflow-hidden rounded-lg bg-primary-100 shadow-soft md:mx-0">
          {book.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.thumbnailUrl} alt={`${book.title} 표지`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">표지 없음</div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
              {book.genre}
            </span>
            {book.bestRank && (
              <span className="w-fit rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
                베스트셀러 {book.bestRank}위
              </span>
            )}
          </div>
          <h1 className="mt-4 text-4xl font-light tracking-tight text-stone-950">{book.title}</h1>
          <p className="mt-2 text-stone-600">{book.author}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-700">
            <StarRating rating={averageRating} />
            <span>{averageRating ? averageRating.toFixed(1) : '평점 없음'}</span>
            <span className="text-stone-300">/</span>
            <span>리뷰 {bookReviews.length.toLocaleString('ko-KR')}</span>
          </div>
          {book.description && <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600">{book.description}</p>}
          <div className="mt-4 space-y-1 text-xs text-stone-500">
            {book.publisher && <p>출판사: {book.publisher}</p>}
            {book.publishedAt && <p>출간일: {formatDate(book.publishedAt)}</p>}
            {book.isbn13 && <p>ISBN: {book.isbn13}</p>}
          </div>
        </div>
      </section>

      <section id="reviews" className="mt-10 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Reader reviews</p>
            <h2 className="section-title mt-2">평점과 리뷰</h2>
          </div>
          <p className="text-sm text-stone-500">{bookReviews.length.toLocaleString('ko-KR')}개 리뷰</p>
        </div>

        <form onSubmit={handleReviewSubmit} className="mt-5 rounded-lg border border-stone-900/10 bg-white/70 p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="rounded-full border border-stone-900/10 px-4 py-2 text-sm outline-none focus:border-primary-400"
              placeholder="닉네임"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="rounded-full border border-stone-900/10 px-4 py-2 text-sm outline-none focus:border-primary-400"
              placeholder="비밀번호"
            />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="rounded-full border border-stone-900/10 px-4 py-2 text-sm outline-none focus:border-primary-400"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}점
                </option>
              ))}
            </select>
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-stone-900/10 px-4 py-2 text-sm outline-none focus:border-primary-400"
              maxLength={100}
              placeholder="짧은 리뷰"
            />
            <button type="submit" className="rounded-full bg-stone-950 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              등록
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-4">
          {bookReviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-stone-900/10 bg-white/70 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">{review.nickname}</p>
                  <p className="mt-1 text-xs text-stone-400">{formatDate(review.createdAt)}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700">{review.comment}</p>
            </article>
          ))}

          {bookReviews.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white/40 p-12 text-center text-sm text-stone-500">
              아직 등록된 독자 리뷰가 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
