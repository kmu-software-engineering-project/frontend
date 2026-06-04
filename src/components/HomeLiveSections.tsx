'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type FeaturedBook = {
  id: string
  itemId: number | null
  title: string
  author: string
  publisher: string
  publishedAt: string
  description: string
  thumbnailUrl: string
  genre: string
  categoryName: string
  rating: number | null
  reviewCount: number | null
  statusTag: '베스트셀러' | '신간'
  bestRank: number | null
}

type ReaderReview = {
  id: string
  bookId: string
  nickname: string
  rating: number
  comment: string
  createdAt: string
}

type FeaturedResponse = {
  books?: FeaturedBook[]
  error?: string
}

type BookDetailResponse = {
  book?: FeaturedBook
  error?: string
}

const REVIEW_STORAGE_KEY = 'book-search-reviews'
const ROLLING_INTERVAL_MS = 3500

function sanitizeContent(value: string) {
  return value
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function readReviews() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? '[]') as ReaderReview[]
  } catch {
    return []
  }
}

function getReviewStats(reviews: ReaderReview[], bookId: string, apiRating: number | null) {
  const bookReviews = reviews.filter((review) => review.bookId === bookId)
  const localAverage =
    bookReviews.length > 0
      ? bookReviews.reduce((sum, review) => sum + review.rating, 0) / bookReviews.length
      : null

  return {
    average: localAverage ?? apiRating,
    count: bookReviews.length,
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

function BookTile({ book, reviews, onSelect }: { book: FeaturedBook; reviews: ReaderReview[]; onSelect: (book: FeaturedBook) => void }) {
  const stats = getReviewStats(reviews, book.id, book.rating)

  return (
    <button type="button" onClick={() => onSelect(book)} className="group block h-full w-full text-left">
      <article className="h-full overflow-hidden rounded-lg border border-stone-900/10 bg-white/75 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-soft">
        <div className="relative aspect-[3/4] bg-primary-100">
          {book.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.thumbnailUrl} alt={`${book.title} 표지`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-stone-400">표지 없음</div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary-800 shadow-sm">
              {book.genre}
            </span>
            <span className="rounded-full bg-stone-950/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              {book.statusTag}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-stone-950 group-hover:text-primary-700">
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm text-stone-600">{book.author}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
            <StarRating rating={stats.average} />
            <span>{stats.average ? stats.average.toFixed(1) : '평점 없음'}</span>
            <span className="text-stone-300">/</span>
            <span>리뷰 {stats.count.toLocaleString('ko-KR')}</span>
          </div>
        </div>
      </article>
    </button>
  )
}

export default function HomeLiveSections() {
  const [books, setBooks] = useState<FeaturedBook[]>([])
  const [reviews, setReviews] = useState<ReaderReview[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<FeaturedBook | null>(null)
  const [selectedBookDetail, setSelectedBookDetail] = useState<FeaturedBook | null>(null)
  const [isLoadingBookDetail, setIsLoadingBookDetail] = useState(false)
  const [bookDetailError, setBookDetailError] = useState<string | null>(null)

  useEffect(() => {
    setReviews(readReviews())

    async function loadFeaturedBooks() {
      try {
        const response = await fetch('/api/books/featured', { cache: 'no-store' })
        const data = (await response.json()) as FeaturedResponse
        if (!response.ok) throw new Error(data.error ?? '추천 도서를 불러오지 못했습니다.')
        setBooks(data.books ?? [])
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : '추천 도서를 불러오지 못했습니다.')
      }
    }

    void loadFeaturedBooks()
  }, [])

  useEffect(() => {
    if (books.length <= 1 || isPaused) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % books.length)
    }, ROLLING_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [books.length, isPaused])

  useEffect(() => {
    if (!selectedBook) return

    let cancelled = false
    setIsLoadingBookDetail(true)
    setBookDetailError(null)
    setSelectedBookDetail(null)

    fetch(`/api/books/${encodeURIComponent(selectedBook.id)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = (await response.json()) as BookDetailResponse
        if (!response.ok) throw new Error(data.error ?? '도서 상세 정보를 불러오지 못했습니다.')
        if (!cancelled) setSelectedBookDetail(data.book ?? null)
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setBookDetailError(caughtError instanceof Error ? caughtError.message : '도서 상세 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBookDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedBook])

  const activeBook = books[activeIndex]
  const topBooks = useMemo(() => books.slice(0, 8), [books])

  function moveSlide(direction: -1 | 1) {
    if (books.length === 0) return
    setActiveIndex((current) => (current + direction + books.length) % books.length)
  }

  return (
    <div className="min-h-full">
      <section
        className="border-b border-stone-900/10 bg-white/35"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="page-shell grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <p className="eyebrow">Curated reading assistant</p>
            <h1 className="max-w-xl text-5xl font-light leading-[1.02] tracking-tight text-stone-950 sm:text-6xl">
              Re:Ading
            </h1>
            <p className="max-w-md text-sm leading-6 text-stone-600">
              실제 도서 API와 독자 리뷰 기록을 바탕으로 지금 살펴볼 만한 책을 보여드립니다.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recommend"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-stone-950 px-6 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700"
              >
                오늘의 추천 도서 보기
              </Link>
              <Link
                href="/reviews"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-900/10 bg-white/70 px-6 text-sm font-semibold text-stone-800 transition hover:border-primary-300 hover:bg-white"
              >
                독자 리뷰 남기기
              </Link>
            </div>
          </div>

          <div className="relative min-h-[470px]">
            {activeBook ? (
              <button
                type="button"
                onClick={() => setSelectedBook(activeBook)}
                className="group grid w-full gap-6 rounded-lg border border-stone-900/10 bg-white/75 p-5 text-left shadow-sm transition hover:bg-white hover:shadow-soft sm:grid-cols-[13rem_1fr]"
              >
                <div className="relative mx-auto aspect-[3/4] w-52 overflow-hidden rounded-lg bg-primary-100 shadow-soft sm:mx-0">
                  {activeBook.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeBook.thumbnailUrl} alt={`${activeBook.title} 표지`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-stone-400">표지 없음</div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
                      {activeBook.genre}
                    </span>
                    <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
                      {activeBook.statusTag}
                    </span>
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-3xl font-light leading-tight text-stone-950 group-hover:text-primary-700">
                    {activeBook.title}
                  </h2>
                  <p className="mt-3 text-sm text-stone-600">{activeBook.author}</p>
                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-stone-600">{activeBook.description}</p>
                </div>
              </button>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-stone-900/10 bg-white/60 text-sm text-stone-500">
                {error ?? '추천 도서를 불러오는 중입니다.'}
              </div>
            )}

            {books.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => moveSlide(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-900/10 bg-white/75 text-xl font-semibold text-stone-700 transition hover:border-primary-300 hover:bg-white"
                  aria-label="이전 슬라이드"
                >
                  ‹
                </button>
                <div className="flex items-center gap-2">
                  {books.map((book, index) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeIndex ? 'w-7 bg-stone-950' : 'w-2.5 bg-stone-300 hover:bg-primary-300'
                      }`}
                      aria-label={`${index + 1}번 슬라이드로 이동`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => moveSlide(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-900/10 bg-white/75 text-xl font-semibold text-stone-700 transition hover:border-primary-300 hover:bg-white"
                  aria-label="다음 슬라이드"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-shell py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Categories</p>
            <h2 className="section-title mt-2">장르별 소개</h2>
          </div>
          <Link href="/genres" className="text-sm font-medium text-stone-600 hover:text-primary-700">
            전체 보기
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {['문학', '인문과학', '사회과학', '자연과학'].map((genre) => (
            <Link
              key={genre}
              href={`/genres?genre=${encodeURIComponent(genre)}`}
              className="rounded-lg border border-stone-900/10 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
            >
              <span className="text-sm font-semibold text-stone-950">{genre}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-900/10 bg-white/35 py-14">
        <div className="page-shell">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">Live books</p>
              <h2 className="section-title mt-2">지금 확인할 책</h2>
            </div>
            <Link href="/reviews" className="text-sm font-medium text-stone-600 hover:text-primary-700">
              리뷰 쓰기
            </Link>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {topBooks.map((book) => (
              <BookTile key={book.id} book={book} reviews={reviews} onSelect={setSelectedBook} />
            ))}
          </div>
        </div>
      </section>

      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 p-0 sm:items-center sm:p-6">
          <div className="mx-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-[#fffaf1] shadow-xl sm:rounded-2xl">
            <div className="border-b border-stone-900/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-[8rem_1fr]">
                  {(selectedBookDetail?.thumbnailUrl ?? selectedBook.thumbnailUrl) && (
                    <div className="hidden aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-lg bg-primary-100 sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedBookDetail?.thumbnailUrl ?? selectedBook.thumbnailUrl}
                        alt={`${selectedBookDetail?.title ?? selectedBook.title} 표지`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary-700">{selectedBookDetail?.genre ?? selectedBook.genre}</p>
                    <h2 className="mt-1 text-xl font-semibold text-stone-950">{selectedBookDetail?.title ?? selectedBook.title}</h2>
                    <p className="mt-1 text-sm text-stone-500">{selectedBookDetail?.author ?? selectedBook.author}</p>
                    {isLoadingBookDetail && (
                      <p className="mt-3 text-sm leading-6 text-primary-700">도서 상세 정보를 불러오는 중입니다.</p>
                    )}
                    {bookDetailError && (
                      <p className="mt-3 text-sm leading-6 text-red-600">{bookDetailError}</p>
                    )}
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {sanitizeContent(selectedBookDetail?.description ?? selectedBook.description) || '도서 소개가 없습니다.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="shrink-0 rounded-full border border-stone-900/10 px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-white"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-5">
              <Link
                href={`/books/${encodeURIComponent(selectedBook.id)}#reviews`}
                className="inline-flex rounded-full bg-stone-950 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                상세 리뷰 보기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
