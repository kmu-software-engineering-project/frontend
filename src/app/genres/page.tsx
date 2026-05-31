'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type SaseoGenre = {
  code: number
  label: string
  description: string
}

type RecommendedBook = {
  id: string
  genre: string
  title: string
  author: string
  publisher: string
  coverUrl: string
  contents: string
  recomYear: number
  recomMonth: number
  publishYear: number
  isbn: string
}

const PAGE_SIZE = 20

const SASEO_GENRES: SaseoGenre[] = [
  { code: 11, label: '문학', description: '소설, 시, 에세이와 이야기의 감각' },
  { code: 6, label: '인문과학', description: '철학, 역사, 예술과 삶의 질문' },
  { code: 5, label: '사회과학', description: '사회, 경제, 교육과 현실 읽기' },
  { code: 4, label: '자연과학', description: '과학, 기술, 자연을 이해하는 책' },
]

const QUERY_GENRE_MAP: Record<string, number> = {
  소설: 11,
  문학: 11,
  인문: 6,
  인문과학: 6,
  역사: 5,
  경제: 5,
  사회과학: 5,
  과학: 4,
  자연과학: 4,
}

function getNodeText(parent: Element, tagName: string) {
  return parent.getElementsByTagName(tagName)[0]?.textContent?.trim() ?? ''
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeCoverUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('//')) return `https:${path}`
  if (/^https?:\/\//.test(path)) return path
  return new URL(path, 'https://www.nl.go.kr').toString()
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseRecommendationXml(xmlText: string) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml')
  const parserError = xml.getElementsByTagName('parsererror')[0]

  if (parserError) {
    throw new Error('추천도서 응답을 읽을 수 없습니다.')
  }

  const totalCount = toNumber(getNodeText(xml.documentElement, 'totalCount'))
  const nodes = Array.from(xml.getElementsByTagName('item'))

  const books = nodes.map((node, index): RecommendedBook => {
    const recomNo = getNodeText(node, 'recom_no')
    const controlNo = getNodeText(node, 'control_no')

    return {
      id: controlNo || recomNo || `${getNodeText(node, 'recom_code')}-${index}`,
      genre: getNodeText(node, 'decode'),
      title: getNodeText(node, 'recom_title'),
      author: getNodeText(node, 'recom_author'),
      publisher: getNodeText(node, 'recom_publisher'),
      coverUrl: normalizeCoverUrl(getNodeText(node, 'recom_file_path')),
      contents: stripHtml(getNodeText(node, 'recom_contents')),
      recomYear: toNumber(getNodeText(node, 'recom_year')),
      recomMonth: toNumber(getNodeText(node, 'recom_month')),
      publishYear: toNumber(getNodeText(node, 'publish_year')),
      isbn: getNodeText(node, 'recome_isbn'),
    }
  })

  return { books, totalCount }
}

function sortByRecentRecommendation(books: RecommendedBook[]) {
  return [...books].sort((first, second) => {
    if (second.recomYear !== first.recomYear) return second.recomYear - first.recomYear
    if (second.recomMonth !== first.recomMonth) return second.recomMonth - first.recomMonth
    return second.id.localeCompare(first.id)
  })
}

export default function GenresPage() {
  const [selectedCode, setSelectedCode] = useState(SASEO_GENRES[0].code)
  const [books, setBooks] = useState<RecommendedBook[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)

  const selectedGenre = useMemo(
    () => SASEO_GENRES.find((genre) => genre.code === selectedCode) ?? SASEO_GENRES[0],
    [selectedCode],
  )
  const hasMore = totalCount > books.length || (totalCount === 0 && books.length >= PAGE_SIZE)

  const loadBooks = useCallback(
    async (pageToLoad: number, code: number) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setIsLoading(true)
      setError(null)

      const startRowNumApi = pageToLoad * PAGE_SIZE + 1
      const endRowNemApi = startRowNumApi + PAGE_SIZE - 1

      try {
        const params = new URLSearchParams({
          drCode: String(code),
          startRowNumApi: String(startRowNumApi),
          endRowNemApi: String(endRowNemApi),
        })
        const response = await fetch(`/api/saseo?${params.toString()}`)

        if (!response.ok) {
          throw new Error('추천도서 정보를 불러오지 못했습니다.')
        }

        const xmlText = await response.text()
        const result = parseRecommendationXml(xmlText)

        if (requestIdRef.current !== requestId) return

        setTotalCount(result.totalCount)
        setBooks((currentBooks) => {
          const nextBooks = pageToLoad === 0 ? result.books : [...currentBooks, ...result.books]
          const uniqueBooks = Array.from(new Map(nextBooks.map((book) => [book.id, book])).values())
          return sortByRecentRecommendation(uniqueBooks)
        })
        setPage(pageToLoad + 1)
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : '추천도서 정보를 불러오지 못했습니다.',
        )
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    const genreFromQuery = new URLSearchParams(window.location.search).get('genre')
    const matchedCode = genreFromQuery ? QUERY_GENRE_MAP[genreFromQuery] : undefined

    if (matchedCode) {
      setSelectedCode(matchedCode)
    }
  }, [])

  useEffect(() => {
    setBooks([])
    setTotalCount(0)
    setPage(0)
    void loadBooks(0, selectedCode)
  }, [loadBooks, selectedCode])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading && hasMore) {
          void loadBooks(page, selectedCode)
        }
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoading, loadBooks, page, selectedCode])

  return (
    <div className="min-h-full bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">장르별 추천도서</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                사서가 직접 고른 추천도서를 분야별로 모았습니다. 추천년도가 최신인 책부터
                보여주고, 화면 아래에 닿으면 다음 목록을 비동기로 불러옵니다.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {totalCount > 0 ? `${books.length.toLocaleString()} / ${totalCount.toLocaleString()}권` : '불러오는 중'}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SASEO_GENRES.map((genre) => {
            const isSelected = genre.code === selectedCode

            return (
              <button
                key={genre.code}
                type="button"
                onClick={() => setSelectedCode(genre.code)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                }`}
              >
                <span className="text-base font-semibold">{genre.label}</span>
                <span className="mt-1 block text-xs leading-5 text-gray-500">{genre.description}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedGenre.label} 추천도서</h2>
            <p className="mt-1 text-sm text-gray-500">추천년도와 추천월 기준 최신순</p>
          </div>
          {isLoading && books.length > 0 && (
            <p className="text-sm font-medium text-primary-600">다음 목록 불러오는 중</p>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} 환경 변수 <span className="font-semibold">NL_SASEO_API_KEY</span>를 설정한 뒤 다시
            시도해 주세요.
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <article
              key={book.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[3/4] bg-gray-100">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={`${book.title} 표지`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-400">
                    표지 이미지 없음
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-primary-700 shadow-sm">
                  {book.recomYear || '-'}년 추천
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{book.genre || selectedGenre.label}</span>
                  {book.recomMonth > 0 && <span>{book.recomMonth}월</span>}
                </div>
                <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-gray-950">
                  {book.title || '제목 미상'}
                </h3>
                <p className="mt-2 line-clamp-1 text-sm text-gray-600">{book.author || '작가 미상'}</p>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  {book.publisher && <p className="line-clamp-1">출판사 {book.publisher}</p>}
                  {book.publishYear > 0 && <p>발행 {book.publishYear}년</p>}
                  {book.isbn && <p className="line-clamp-1">ISBN {book.isbn}</p>}
                </div>
                {book.contents && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{book.contents}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        {isLoading && books.length === 0 && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="aspect-[3/4] animate-pulse bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && books.length === 0 && !error && (
          <div className="mt-12 rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
            해당 장르의 추천도서를 찾지 못했습니다.
          </div>
        )}

        <div ref={sentinelRef} className="h-12" aria-hidden="true" />

        {!hasMore && books.length > 0 && (
          <p className="pb-8 text-center text-sm text-gray-400">모든 추천도서를 불러왔습니다.</p>
        )}
      </main>
    </div>
  )
}
