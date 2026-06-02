'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface RecommendedBook {
  id: string
  title: string
  author: string
  publisher?: string
  genre?: string
  rating?: number
  thumbnailUrl?: string
  coverImage?: string
  thumbnail?: string
  description?: string
  publishedYear?: number
  tags?: string[]
  categories?: string[]
  reason?: string
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

const COVER_GRADIENTS = [
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

function ResultContent() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState<RecommendedBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

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

  const queryTerms = criteria.map((criterion) => criterion.value.trim())

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
        setResults(Array.isArray(data) ? data : [])
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

  return (
    <div className="page-shell py-12">
      <Link href="/recommend" className="mb-8 inline-flex text-sm font-medium text-stone-600 hover:text-primary-700">
        다시 추천받기
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
        <div className="mb-8 flex flex-wrap gap-2">
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
        <div className="grid gap-4">
          {results.map((book, index) => {
            const tags = book.tags ?? book.categories ?? []
            const cover = book.coverImage ?? book.thumbnailUrl ?? book.thumbnail
            const [firstColor, secondColor] = COVER_GRADIENTS[index % COVER_GRADIENTS.length]
            const initial = book.title.charAt(0)

            return (
              <article
                key={book.id}
                className="overflow-hidden rounded-lg border border-stone-900/10 bg-white/75 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
              >
                <div className="grid gap-0 sm:grid-cols-[4rem_7rem_1fr]">
                  <div className="hidden border-r border-stone-900/10 p-5 text-center sm:block">
                    <p className="text-xl font-light text-primary-700">{String(index + 1).padStart(2, '0')}</p>
                  </div>
                  <div className="h-44 sm:h-full" style={{ background: `linear-gradient(160deg, ${firstColor}, ${secondColor})` }}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl font-light text-white/90">{initial}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-semibold leading-7 text-stone-950">{book.title}</h2>
                    <p className="mt-1 text-sm text-stone-500">
                      {[book.author, book.publisher].filter(Boolean).join(' · ')}
                      {book.publishedYear ? ` · ${book.publishedYear}` : ''}
                    </p>

                    {tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const isMatch = queryTerms.some((query) => tag.includes(query) || query.includes(tag))
                          return (
                            <span
                              key={tag}
                              className={`rounded-full border px-2.5 py-1 text-xs ${
                                isMatch
                                  ? 'border-primary-300 bg-primary-50 text-primary-800'
                                  : 'border-stone-900/10 bg-white/70 text-stone-500'
                              }`}
                            >
                              #{tag}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {book.reason && (
                      <p className="mt-4 rounded-lg bg-primary-50 p-4 text-sm leading-6 text-primary-900">{book.reason}</p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href={STORE_URLS.yes24(book.title)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-stone-900/10 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white">
                        Yes24
                      </a>
                      <a href={STORE_URLS.aladin(book.title)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-stone-900/10 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white">
                        알라딘
                      </a>
                      <a href={STORE_URLS.kyobo(book.title)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-stone-900/10 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white">
                        교보문고
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
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
