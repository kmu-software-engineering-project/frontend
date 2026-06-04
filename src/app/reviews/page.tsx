'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Genre =
  | '전체'
  | '소설'
  | '에세이'
  | '자기계발'
  | '경제/경영'
  | '인문'
  | '사회/정치'
  | '과학'
  | '예술'
  | '어린이'
  | '기타'

type Book = {
  id: string
  title: string
  contents: string
  url: string
  isbn: string
  isbn13: string
  publishedAt: string
  authors: string[]
  publisher: string
  price: number
  salePrice: number
  thumbnail: string
  status: string
  genre: Genre
  aladinCategoryName: string
}

type BackendReview = {
  id: number | string
  book_id: string
  nickname: string
  rating: number
  comment: string
  created_at: string
}

type SearchResponse = {
  books: Book[]
  nextPage: number
  isEnd: boolean
  error?: string
}

type BookDetailResponse = {
  book?: {
    description?: string
  }
  error?: string
}

type SortMode = 'latest' | 'rating'

const GENRES: Genre[] = ['전체', '소설', '에세이', '자기계발', '경제/경영', '인문', '사회/정치', '과학', '예술', '어린이', '기타']
const INITIAL_BATCH_SIZE = 200
const SCROLL_BATCH_SIZE = 100

function sanitizeContent(value: string) {
  return value
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatPopupDescription(value: string) {
  const content = sanitizeContent(value)
  if (!content) return '도서 소개가 없습니다.'
  return content.endsWith('.') ? content : `${content}...`
}

function formatDate(value: string) {
  if (!value) return '출판일 미상'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '출판일 미상'
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

function formatPrice(value: number) {
  if (!value || value < 0) return '가격 정보 없음'
  return `${value.toLocaleString('ko-KR')}원`
}

function mergeUniqueBooks(currentBooks: Book[], nextBooks: Book[]) {
  const bookMap = new Map<string, Book>()
  for (const book of [...currentBooks, ...nextBooks]) bookMap.set(book.id, book)
  return [...bookMap.values()].sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rating ? 'text-primary-700' : 'text-stone-300'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [query, setQuery] = useState('책')
  const [submittedQuery, setSubmittedQuery] = useState('책')
  const [selectedGenre, setSelectedGenre] = useState<Genre>('전체')
  const [books, setBooks] = useState<Book[]>([])
  const [reviewsByBook, setReviewsByBook] = useState<Record<string, BackendReview[]>>({})
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedBookDescription, setSelectedBookDescription] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('latest')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextPage, setNextPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!selectedBook) return
    if (reviewsByBook[selectedBook.id] !== undefined) return

    let cancelled = false
    setIsLoadingReviews(true)
    setReviewError(null)

    fetch(`/api/reviews?book_id=${encodeURIComponent(selectedBook.id)}`)
      .then(async (response) => {
        const data = await response.json()
        if (cancelled) return
        const list: BackendReview[] = Array.isArray(data) ? data : (data.results ?? data.reviews ?? [])
        setReviewsByBook((prev) => ({ ...prev, [selectedBook.id]: list }))
      })
      .catch(() => {
        if (!cancelled) setReviewError('리뷰를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingReviews(false)
      })

    return () => { cancelled = true }
  }, [selectedBook]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedBook) {
      setSelectedBookDescription(null)
      return
    }

    let cancelled = false
    setSelectedBookDescription(null)

    fetch(`/api/books/${encodeURIComponent(selectedBook.id)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = (await response.json()) as BookDetailResponse
        if (!cancelled && response.ok) setSelectedBookDescription(data.book?.description ?? null)
      })
      .catch(() => {
        if (!cancelled) setSelectedBookDescription(null)
      })

    return () => {
      cancelled = true
    }
  }, [selectedBook])

  const loadBooks = useCallback(
    async ({ page, limit, replace, signal }: { page: number; limit: number; replace: boolean; signal?: AbortSignal }) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      if (replace) setIsLoading(true)
      else setIsLoadingMore(true)
      setError(null)

      try {
        const params = new URLSearchParams({ query: submittedQuery, page: String(page), limit: String(limit) })
        const response = await fetch(`/api/books/search?${params.toString()}`, { signal })
        const data = (await response.json()) as SearchResponse

        if (!response.ok) throw new Error(data.error ?? '도서 검색에 실패했습니다.')
        if (requestIdRef.current !== requestId || signal?.aborted) return

        setBooks((currentBooks) => (replace ? data.books ?? [] : mergeUniqueBooks(currentBooks, data.books ?? [])))
        setNextPage(data.nextPage)
        setHasMore(!data.isEnd && (data.books?.length ?? 0) > 0)
      } catch (caughtError) {
        if (signal?.aborted) return
        if (replace) setBooks([])
        setError(caughtError instanceof Error ? caughtError.message : '도서 검색에 실패했습니다.')
      } finally {
        if (requestIdRef.current === requestId && !signal?.aborted) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [submittedQuery],
  )

  useEffect(() => {
    const controller = new AbortController()
    setBooks([])
    setNextPage(1)
    setHasMore(true)
    void loadBooks({ page: 1, limit: INITIAL_BATCH_SIZE, replace: true, signal: controller.signal })
    return () => controller.abort()
  }, [loadBooks])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || books.length === 0) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          void loadBooks({ page: nextPage, limit: SCROLL_BATCH_SIZE, replace: false })
        }
      },
      { rootMargin: '520px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [books.length, hasMore, isLoading, isLoadingMore, loadBooks, nextPage])

  const filteredBooks = useMemo(() => {
    if (selectedGenre === '전체') return books
    return books.filter((book) => book.genre === selectedGenre)
  }, [books, selectedGenre])

  const selectedBookReviews = useMemo(() => {
    if (!selectedBook) return []
    const bookReviews = reviewsByBook[selectedBook.id] ?? []
    return [...bookReviews].sort((first, second) => {
      if (sortMode === 'rating') return second.rating - first.rating
      return second.created_at.localeCompare(first.created_at)
    })
  }, [reviewsByBook, selectedBook, sortMode])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = query.trim()
    if (!nextQuery) return
    setSelectedGenre('전체')
    setSubmittedQuery(nextQuery)
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBook || !nickname.trim() || !password.trim() || !comment.trim()) return

    setReviewError(null)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.id,
          bookTitle: selectedBook.title,
          nickname: nickname.trim(),
          password: password.trim(),
          rating,
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        setReviewError(data.error ?? '리뷰 등록에 실패했습니다.')
        return
      }

      const newReview = (await response.json()) as BackendReview
      setReviewsByBook((prev) => ({
        ...prev,
        [selectedBook.id]: [newReview, ...(prev[selectedBook.id] ?? [])],
      }))

      setNickname('')
      setPassword('')
      setRating(5)
      setComment('')
    } catch {
      setReviewError('리뷰 등록에 실패했습니다.')
    }
  }

  async function handleDeleteReview(reviewId: number | string) {
    const pw = window.prompt('리뷰를 삭제하려면 등록 시 입력한 비밀번호를 입력하세요.')
    if (pw === null) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })

      if (!response.ok && response.status !== 204) {
        alert('비밀번호가 올바르지 않거나 리뷰를 삭제할 수 없습니다.')
        return
      }

      if (selectedBook) {
        setReviewsByBook((prev) => ({
          ...prev,
          [selectedBook.id]: (prev[selectedBook.id] ?? []).filter((r) => String(r.id) !== String(reviewId)),
        }))
      }
    } catch {
      alert('리뷰 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-full">
      <section className="border-b border-stone-900/10 bg-white/35">
        <div className="page-shell py-10">
          <p className="eyebrow">Search</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight text-stone-950">도서 검색과 리뷰</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
            책을 검색하고, 선택한 책에 짧은 독서 기록을 남길 수 있습니다.
          </p>

          <form onSubmit={handleSearch} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="book-query">
              검색어
            </label>
            <input
              id="book-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-12 flex-1 rounded-full border border-stone-900/10 bg-white/80 px-5 text-base text-stone-950 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              placeholder="책 제목, 저자, 키워드를 입력하세요"
            />
            <button
              type="submit"
              className="min-h-12 rounded-full bg-stone-950 px-7 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={isLoading}
            >
              {isLoading ? '검색 중' : '검색'}
            </button>
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {GENRES.map((genre) => {
              const isSelected = genre === selectedGenre
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : 'border-stone-900/10 bg-white/65 text-stone-600 hover:border-primary-300 hover:bg-white'
                  }`}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <main className="page-shell py-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Results</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">{submittedQuery} 검색 결과</h2>
          </div>
          {(isLoading || isLoadingMore) && <p className="text-sm font-medium text-primary-700">도서를 불러오는 중입니다.</p>}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} 환경 변수 <span className="font-semibold">KAKAO_REST_API_KEY</span>와{' '}
            <span className="font-semibold">ALADIN_TTB_KEY</span>를 확인해 주세요.
          </div>
        )}

        {!isLoading && filteredBooks.length === 0 && !error && (
          <div className="rounded-lg border border-stone-900/10 bg-white/70 p-12 text-center text-stone-500">
            검색 결과가 없습니다.
          </div>
        )}

        <div className="space-y-4">
          {filteredBooks.map((book) => {
            const bookReviews = reviewsByBook[book.id]
            const reviewCount = bookReviews?.length ?? 0
            const reviewAverage =
              bookReviews && bookReviews.length > 0
                ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length
                : null

            return (
              <article
                key={book.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedBook(book)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedBook(book)
                }}
                className="flex cursor-pointer flex-col gap-4 rounded-lg border border-stone-900/10 bg-white/75 p-4 shadow-sm transition hover:bg-white hover:shadow-soft sm:flex-row"
              >
                <div className="mx-auto h-44 w-32 shrink-0 overflow-hidden rounded-md bg-primary-100 sm:mx-0">
                  {book.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.thumbnail} alt={`${book.title} 표지`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-xs text-stone-400">표지 없음</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-800">{book.genre}</span>
                    <span>{formatDate(book.publishedAt)}</span>
                    {book.status && <span>{book.status}</span>}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold leading-7 text-stone-950">{book.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {book.authors.join(', ') || '저자 정보 없음'} · {book.publisher || '출판사 정보 없음'}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                    {book.contents ? sanitizeContent(book.contents) : '도서 소개가 없습니다.'}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-700">
                    <span>정가 {formatPrice(book.price)}</span>
                    <span>판매가 {formatPrice(book.salePrice)}</span>
                    {book.aladinCategoryName && <span className="text-stone-500">{book.aladinCategoryName}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-stone-900/10 pt-4 sm:w-40 sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <div className="text-sm text-stone-600">
                    <p className="font-semibold text-stone-950">리뷰 {reviewCount.toLocaleString('ko-KR')}개</p>
                    <p>{reviewAverage ? `평균 ${reviewAverage.toFixed(1)}점` : '첫 리뷰를 남겨보세요'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedBook(book)
                    }}
                    className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-primary-300 hover:bg-primary-50"
                  >
                    리뷰 보기
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {isLoading && books.length === 0 && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-lg bg-white/60" />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-12" aria-hidden="true" />

        {isLoadingMore && <p className="pb-8 text-center text-sm font-medium text-primary-700">다음 도서 목록을 불러오는 중입니다.</p>}
        {!hasMore && books.length > 0 && <p className="pb-8 text-center text-sm text-stone-400">모든 검색 결과를 불러왔습니다.</p>}
      </main>

      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 p-0 sm:items-center sm:p-6">
          <div className="mx-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-[#fffaf1] shadow-xl sm:rounded-2xl">
            <div className="border-b border-stone-900/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-700">{selectedBook.genre}</p>
                  <h2 className="mt-1 text-xl font-semibold text-stone-950">{selectedBook.title}</h2>
                  <p className="mt-1 text-sm text-stone-500">{selectedBook.authors.join(', ') || '저자 정보 없음'}</p>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {formatPopupDescription(selectedBookDescription ?? selectedBook.contents)}
                  </p>
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
              {reviewError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reviewError}</div>
              )}

              <form onSubmit={handleReviewSubmit} className="rounded-lg border border-stone-900/10 bg-white/60 p-4">
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
                    maxLength={80}
                    placeholder="한 줄 리뷰"
                  />
                  <button type="submit" className="rounded-full bg-stone-950 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                    등록
                  </button>
                </div>
              </form>

              <div className="mt-5 flex items-center justify-between">
                <h3 className="font-semibold text-stone-950">방명록 리뷰</h3>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="rounded-full border border-stone-900/10 px-3 py-2 text-sm outline-none focus:border-primary-400"
                >
                  <option value="latest">최신순</option>
                  <option value="rating">평점 높은순</option>
                </select>
              </div>

              {isLoadingReviews && (
                <div className="mt-3 py-6 text-center text-sm text-primary-700">리뷰를 불러오는 중입니다.</div>
              )}

              <div className="mt-3 space-y-3">
                {selectedBookReviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-stone-900/10 bg-white/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">{review.nickname}</p>
                        <p className="mt-1 text-xs text-stone-400">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-xs text-stone-400 hover:text-red-500"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-700">{review.comment}</p>
                  </article>
                ))}

                {!isLoadingReviews && selectedBookReviews.length === 0 && (
                  <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                    아직 등록된 리뷰가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
