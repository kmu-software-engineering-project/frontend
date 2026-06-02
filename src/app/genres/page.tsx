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
  { code: 11, label: '문학', description: '소설, 시, 에세이처럼 이야기의 감각이 살아 있는 책' },
  { code: 6, label: '인문과학', description: '철학, 역사, 예술과 삶의 질문을 다루는 책' },
  { code: 5, label: '사회과학', description: '사회, 경제, 교육과 현실을 읽는 책' },
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

function getFirstNodeText(parent: Element, tagNames: string[]) {
  for (const tagName of tagNames) {
    const value = getNodeText(parent, tagName)
    if (value) return value
  }

  return ''
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
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRecommendationXml(xmlText: string) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml')
  const parserError = xml.getElementsByTagName('parsererror')[0]

  if (parserError) {
    throw new Error('추천 도서 응답을 읽을 수 없습니다.')
  }

  const totalCount = toNumber(getNodeText(xml.documentElement, 'totalCount'))
  const nodes = Array.from(xml.getElementsByTagName('item'))

  const books = nodes.map((node, index): RecommendedBook => {
    const recomNo = getFirstNodeText(node, ['recomNo', 'recom_no'])
    const controlNo = getFirstNodeText(node, ['controlNo', 'control_no'])

    return {
      id:
        controlNo ||
        recomNo ||
        `${getFirstNodeText(node, ['drCode', 'drcode', 'recom_code'])}-${index}`,
      genre: getFirstNodeText(node, ['drCodeName', 'decodeName', 'decode']),
      title: getFirstNodeText(node, ['recomtitle', 'recom_title']),
      author: getFirstNodeText(node, ['recomauthor', 'recom_author']),
      publisher: getFirstNodeText(node, ['recompublisher', 'recom_publisher']),
      coverUrl: normalizeCoverUrl(getFirstNodeText(node, ['recomfilepath', 'recom_file_path'])),
      contents: stripHtml(
        getFirstNodeText(node, ['recomcontents', 'recomcontens', 'recom_contents']),
      ),
      recomYear: toNumber(getFirstNodeText(node, ['recomYear', 'recom_year'])),
      recomMonth: toNumber(getFirstNodeText(node, ['recomMonth', 'recom_month'])),
      publishYear: toNumber(getFirstNodeText(node, ['publishYear', 'publish_year'])),
      isbn: getFirstNodeText(node, ['recomisbn', 'recome_isbn']),
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
  const totalCountRef = useRef(0)

  const selectedGenre = useMemo(
    () => SASEO_GENRES.find((genre) => genre.code === selectedCode) ?? SASEO_GENRES[0],
    [selectedCode],
  )
  const hasMore = totalCount > books.length || (totalCount === 0 && books.length >= PAGE_SIZE)

  const fetchBooksRange = useCallback(async (code: number, startRow: number, endRow: number) => {
    const params = new URLSearchParams({
      drCode: String(code),
      startRowNumApi: String(startRow),
      endRowNumApi: String(endRow),
    })
    const response = await fetch(`/api/saseo?${params.toString()}`)

    if (!response.ok) throw new Error('추천 도서 정보를 불러오지 못했습니다.')

    return parseRecommendationXml(await response.text())
  }, [])

  const loadBooks = useCallback(async (pageToLoad: number, code: number) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)
    setError(null)

    try {
      const knownTotalCount =
        pageToLoad === 0 ? (await fetchBooksRange(code, 1, 1)).totalCount : totalCountRef.current
      const rangeEnd = Math.max(knownTotalCount - pageToLoad * PAGE_SIZE, 0)
      const rangeStart = Math.max(rangeEnd - PAGE_SIZE + 1, 1)
      const result =
        rangeEnd > 0 ? await fetchBooksRange(code, rangeStart, rangeEnd) : { books: [], totalCount: 0 }

      if (requestIdRef.current !== requestId) return

      const nextTotalCount = result.totalCount || knownTotalCount
      totalCountRef.current = nextTotalCount
      setTotalCount(nextTotalCount)
      setBooks((currentBooks) => {
        const nextBooks = pageToLoad === 0 ? result.books : [...currentBooks, ...result.books]
        const uniqueBooks = Array.from(new Map(nextBooks.map((book) => [book.id, book])).values())
        return sortByRecentRecommendation(uniqueBooks)
      })
      setPage(pageToLoad + 1)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '추천 도서 정보를 불러오지 못했습니다.')
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false)
    }
  }, [fetchBooksRange])

  useEffect(() => {
    const genreFromQuery = new URLSearchParams(window.location.search).get('genre')
    const matchedCode = genreFromQuery ? QUERY_GENRE_MAP[genreFromQuery] : undefined
    if (matchedCode) setSelectedCode(matchedCode)
  }, [])

  useEffect(() => {
    setBooks([])
    setTotalCount(0)
    totalCountRef.current = 0
    setPage(0)
    void loadBooks(0, selectedCode)
  }, [loadBooks, selectedCode])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading && hasMore) void loadBooks(page, selectedCode)
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoading, loadBooks, page, selectedCode])

  return (
    <div className="min-h-full">
      <section className="border-b border-stone-900/10 bg-white/35">
        <div className="page-shell py-12">
          <p className="eyebrow">Category</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-light tracking-tight text-stone-950">분야별 추천 도서</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
                국립중앙도서관 사서 추천 목록을 분야별로 모았습니다. 아래로 스크롤하면 다음 목록을 이어서 불러옵니다.
              </p>
            </div>
            <p className="text-sm text-stone-500">
              {totalCount > 0 ? `${books.length.toLocaleString()} / ${totalCount.toLocaleString()}권` : '불러오는 중'}
            </p>
          </div>
        </div>
      </section>

      <main className="page-shell py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SASEO_GENRES.map((genre) => {
            const isSelected = genre.code === selectedCode
            return (
              <button
                key={genre.code}
                type="button"
                onClick={() => setSelectedCode(genre.code)}
                className={`rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? 'border-stone-950 bg-stone-950 text-white shadow-soft'
                    : 'border-stone-900/10 bg-white/65 text-stone-700 hover:border-primary-300 hover:bg-white'
                }`}
              >
                <span className="text-base font-semibold">{genre.label}</span>
                <span className={`mt-2 block text-xs leading-5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                  {genre.description}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Selected</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">{selectedGenre.label} 추천 도서</h2>
          </div>
          {isLoading && books.length > 0 && <p className="text-sm font-medium text-primary-700">다음 목록을 불러오는 중</p>}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} 환경 변수 <span className="font-semibold">NL_SASEO_API_KEY</span>를 확인해 주세요.
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <article
              key={book.id}
              className="overflow-hidden rounded-lg border border-stone-900/10 bg-white/75 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
            >
              <div className="relative aspect-[3/4] bg-primary-100">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt={`${book.title} 표지`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-400">
                    표지 이미지 없음
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary-800 shadow-sm">
                  {book.recomYear || '-'} 추천
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>{book.genre || selectedGenre.label}</span>
                  {book.recomMonth > 0 && <span>{book.recomMonth}월</span>}
                </div>
                <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-stone-950">
                  {book.title || '제목 미상'}
                </h3>
                <p className="mt-2 line-clamp-1 text-sm text-stone-600">{book.author || '작가 미상'}</p>
                <div className="mt-3 space-y-1 text-xs text-stone-500">
                  {book.publisher && <p className="line-clamp-1">출판사 {book.publisher}</p>}
                  {book.publishYear > 0 && <p>발행 {book.publishYear}년</p>}
                  {book.isbn && <p className="line-clamp-1">ISBN {book.isbn}</p>}
                </div>
                {book.contents && <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{book.contents}</p>}
              </div>
            </article>
          ))}
        </div>

        {isLoading && books.length === 0 && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-stone-900/10 bg-white/60">
                <div className="aspect-[3/4] animate-pulse bg-stone-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
                  <div className="h-5 w-full animate-pulse rounded bg-stone-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && books.length === 0 && !error && (
          <div className="mt-12 rounded-lg border border-stone-900/10 bg-white/70 p-10 text-center text-stone-500">
            해당 분야의 추천 도서를 찾지 못했습니다.
          </div>
        )}

        <div ref={sentinelRef} className="h-12" aria-hidden="true" />

        {!hasMore && books.length > 0 && <p className="pb-8 text-center text-sm text-stone-400">모든 추천 도서를 불러왔습니다.</p>}
      </main>
    </div>
  )
}
