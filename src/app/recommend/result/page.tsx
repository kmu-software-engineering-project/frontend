'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface RecommendedBook {
  id: string
  title: string
  author: string
  publisher?: string
  publishedYear?: number
  tags?: string[]
  categories?: string[]
  reason?: string
}

interface KakaoBookData {
  thumbnail: string | null
  description: string | null
}

const STORE_URLS = {
  yes24: (title: string) => `https://www.yes24.com/Product/Search?query=${encodeURIComponent(title)}`,
  aladin: (title: string) => `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${encodeURIComponent(title)}`,
  kyobo: (title: string) => `https://product.kyobobook.co.kr/search?query=${encodeURIComponent(title)}`,
}

const LOADING_MESSAGES = [
  '취향을 분석하고 있습니다.',
  '도서 후보를 좁히고 있습니다.',
  '추천 이유를 정리하고 있습니다.',
  '마지막으로 균형을 맞추는 중입니다.',
]

const COVER_GRADIENTS: [string, string][] = [
  ['#2c2018', '#a8794a'],
  ['#3b332b', '#d8ccb6'],
  ['#554331', '#cfaa75'],
  ['#26231f', '#8b7355'],
  ['#4d3422', '#ead9c1'],
]

function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? current : Math.min(88, current + (current < 40 ? 8 : 3))))
    }, 350)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-stone-900/10 bg-white/65 shadow-soft">
          <span className="text-3xl font-light text-stone-950">R</span>
        </div>
        <p className="text-sm font-semibold text-stone-800">{LOADING_MESSAGES[messageIndex]}</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/70">
          <div className="h-full rounded-full bg-stone-950 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-xs text-stone-500">{Math.round(progress)}%</p>
      </div>
    </div>
  )
}

function BookModal({
  book,
  kakao,
  index,
  onClose,
}: {
  book: RecommendedBook
  kakao: KakaoBookData | null
  index: number
  onClose: () => void
}) {
  const [bg1, bg2] = COVER_GRADIENTS[index % COVER_GRADIENTS.length]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
          aria-label="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Cover — gradient fallback에 글씨 없음 */}
          <div
            className="h-52 w-full shrink-0 sm:h-auto sm:w-48"
            style={{ background: `linear-gradient(160deg, ${bg1}, ${bg2})` }}
          >
            {kakao?.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kakao.thumbnail} alt={book.title} className="h-full w-full object-cover" />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <p className="text-xs font-bold tracking-widest text-primary-700">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-tight text-stone-950">{book.title}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {[book.author, book.publisher].filter(Boolean).join(' · ')}
              {book.publishedYear ? ` · ${book.publishedYear}` : ''}
            </p>

            {kakao?.description && (
              <p className="mt-3 line-clamp-4 text-xs leading-5 text-stone-600">{kakao.description}</p>
            )}

            {book.reason && (
              <div className="mt-4 rounded-xl bg-primary-50 p-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary-600">추천 근거</p>
                <p className="text-sm leading-6 text-primary-900">{book.reason}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={STORE_URLS.kyobo(book.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                교보문고
              </a>
              <a
                href={STORE_URLS.yes24(book.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-stone-900/20 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Yes24
              </a>
              <a
                href={STORE_URLS.aladin(book.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-stone-900/20 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                알라딘
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultContent() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState<RecommendedBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [kakaoData, setKakaoData] = useState<Record<string, KakaoBookData>>({})
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const bookType = searchParams.get('bookType') || ''
  const genre = searchParams.get('genre') || ''
  const interest = searchParams.get('interest') || ''
  const purpose = searchParams.get('purpose') || ''
  const atmosphere = searchParams.get('atmosphere') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const pastBooks = searchParams.get('pastBooks') || ''
  const avoidElements = searchParams.get('avoidElements') || ''

  const criteria = [
    { label: '유형', value: bookType },
    { label: '장르', value: genre },
    { label: '관심', value: interest },
    { label: '목적', value: purpose },
    { label: '분위기', value: atmosphere },
    { label: '난이도', value: difficulty },
    { label: '참고 도서', value: pastBooks },
    { label: '제외 요소', value: avoidElements },
  ].filter((criterion) => criterion.value.trim())

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookType, genre, interest, purpose, atmosphere, difficulty, pastBooks, avoidElements }),
        })
        if (!response.ok) throw new Error('API error')
        const data = await response.json()
        const books: RecommendedBook[] = (Array.isArray(data) ? data : []).slice(0, 5)
        setResults(books)

        // Fetch Kakao/Aladin cover + description for each book in parallel
        const kakaoResults = await Promise.all(
          books.map(async (book) => {
            try {
              const res = await fetch(`/api/kakao-book?q=${encodeURIComponent(book.title)}`)
              if (!res.ok) return { id: book.id, data: null }
              const d = (await res.json()) as KakaoBookData | null
              return { id: book.id, data: d }
            } catch {
              return { id: book.id, data: null }
            }
          }),
        )
        const map: Record<string, KakaoBookData> = {}
        for (const { id, data } of kakaoResults) {
          if (data) map[id] = data
        }
        setKakaoData(map)
      } catch {
        setIsError(true)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }
    void fetchRecommendations()
  }, [bookType, genre, interest, purpose, atmosphere, difficulty, pastBooks, avoidElements])

  if (isLoading) return <LoadingScreen />

  const selectedBook = selectedIndex !== null ? results[selectedIndex] : null

  return (
    <div className="page-shell py-12">
      <Link href="/recommend" className="mb-8 inline-flex text-sm font-medium text-stone-600 hover:text-primary-700">
        ← 다시 추천받기
      </Link>

      <div className="mb-8">
        <p className="eyebrow">AI Result</p>
        {isError ? (
          <h1 className="mt-2 text-4xl font-light tracking-tight text-stone-950">추천을 불러오지 못했습니다</h1>
        ) : results.length > 0 ? (
          <h1 className="mt-2 text-4xl font-light tracking-tight text-stone-950">{results.length}권의 책을 추천했어요</h1>
        ) : (
          <h1 className="mt-2 text-4xl font-light tracking-tight text-stone-950">추천 결과</h1>
        )}
      </div>

      {criteria.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          {criteria.map((criterion) => (
            <span key={criterion.label} className="rounded-full border border-stone-900/10 bg-white/65 px-3 py-1.5 text-xs text-stone-600">
              <span className="font-semibold text-primary-700">{criterion.label}</span> {criterion.value}
            </span>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
          추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      {!isError && results.length === 0 && (
        <div className="rounded-lg border border-stone-900/10 bg-white/70 p-10 text-center text-sm text-stone-500">
          조건에 맞는 책을 찾지 못했습니다. 조건을 조금 바꿔 다시 시도해 보세요.
        </div>
      )}

      {!isError && results.length > 0 && (
        <>
          <p className="mb-6 text-xs text-stone-400">카드를 클릭하면 추천 근거와 구매 링크를 확인할 수 있어요</p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {results.map((book, index) => {
              const kakao = kakaoData[book.id] ?? null
              const [bg1, bg2] = COVER_GRADIENTS[index % COVER_GRADIENTS.length]
              return (
                <button
                  key={book.id}
                  onClick={() => setSelectedIndex(index)}
                  className="group text-left"
                >
                  {/* Cover — gradient fallback에 글씨 없음 */}
                  <div
                    className="relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-md transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-xl"
                    style={{ background: `linear-gradient(160deg, ${bg1}, ${bg2})` }}
                  >
                    {kakao?.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={kakao.thumbnail} alt={book.title} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute left-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  {/* Info — description 유무와 무관하게 min-h로 레이아웃 고정 */}
                  <div className="mt-3 px-0.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 transition-colors group-hover:text-primary-700">
                      {book.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-stone-500">{book.author}</p>
                    <div className="mt-1.5 min-h-[2rem]">
                      {kakao?.description && (
                        <p className="line-clamp-2 text-xs leading-4 text-stone-400">{kakao.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {selectedBook !== null && selectedIndex !== null && (
        <BookModal
          book={selectedBook}
          kakao={kakaoData[selectedBook.id] ?? null}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  )
}

export default function RecommendResultPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResultContent />
    </Suspense>
  )
}
