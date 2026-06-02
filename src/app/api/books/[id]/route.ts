import { NextResponse } from 'next/server'

const ALADIN_ITEM_LOOKUP_URL = 'http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx'
const KAKAO_BOOK_SEARCH_URL = 'https://dapi.kakao.com/v3/search/book'

type AladinItem = {
  itemId?: number
  title?: string
  author?: string
  publisher?: string
  pubDate?: string
  description?: string
  isbn?: string
  isbn13?: string
  cover?: string
  link?: string
  categoryName?: string
  customerReviewRank?: number
  bestRank?: number
}

type AladinResponse = {
  item?: AladinItem[]
}

type KakaoBook = {
  title: string
  contents: string
  url: string
  isbn: string
  datetime: string
  authors: string[]
  publisher: string
  translators: string[]
  price: number
  sale_price: number
  thumbnail: string
  status: string
}

type KakaoResponse = {
  documents: KakaoBook[]
}

function sanitizeAladinJson(text: string): AladinResponse {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('{') ? trimmed : trimmed.replace(/^[^(]*\(/, '').replace(/\);?$/, '')
  return JSON.parse(jsonText) as AladinResponse
}

function stripTags(value = '') {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeComparable(value = '') {
  return stripTags(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function getIsbnParts(isbn = '') {
  const parts = isbn.split(/\s+/).map((part) => part.trim()).filter(Boolean)
  return {
    isbn10: parts.find((part) => part.length === 10) ?? '',
    isbn13: parts.find((part) => part.length === 13) ?? '',
  }
}

function getGenre(categoryName = '') {
  const parts = categoryName.split('>').map((part) => part.trim()).filter(Boolean)
  return parts.find((part) => !['국내도서', '외국도서'].includes(part)) ?? '기타'
}

function getItemIdType(id: string) {
  if (/^\d{13}$/.test(id)) return 'ISBN13'
  if (/^\d{10}$/.test(id)) return 'ISBN'
  return 'ItemId'
}

function titleMatches(first = '', second = '') {
  const left = normalizeComparable(first)
  const right = normalizeComparable(second)
  return Boolean(left && right && (left.includes(right) || right.includes(left)))
}

function authorMatches(kakaoAuthors: string[], aladinAuthor = '') {
  const normalizedAladinAuthor = normalizeComparable(aladinAuthor)
  return kakaoAuthors.some((author) => {
    const normalizedAuthor = normalizeComparable(author)
    return Boolean(
      normalizedAuthor &&
        normalizedAladinAuthor &&
        (normalizedAladinAuthor.includes(normalizedAuthor) || normalizedAuthor.includes(normalizedAladinAuthor)),
    )
  })
}

function publisherMatches(kakaoPublisher = '', aladinPublisher = '') {
  const left = normalizeComparable(kakaoPublisher)
  const right = normalizeComparable(aladinPublisher)
  return Boolean(left && right && (left.includes(right) || right.includes(left)))
}

function findMatchingKakaoBook(kakaoBooks: KakaoBook[], aladinItem: AladinItem) {
  const aladinIsbns = new Set([aladinItem.isbn, aladinItem.isbn13].filter(Boolean))
  const isbnMatch = kakaoBooks.find((book) => {
    const { isbn10, isbn13 } = getIsbnParts(book.isbn)
    return aladinIsbns.has(isbn10) || aladinIsbns.has(isbn13)
  })
  if (isbnMatch) return isbnMatch

  const scoredBooks = kakaoBooks
    .map((book) => {
      const titleScore = titleMatches(book.title, aladinItem.title) ? 2 : 0
      const publisherScore = publisherMatches(book.publisher, aladinItem.publisher) ? 1 : 0
      const authorScore = authorMatches(book.authors, aladinItem.author) ? 1 : 0
      return { book, score: titleScore + publisherScore + authorScore }
    })
    .sort((first, second) => second.score - first.score)

  return scoredBooks[0]?.score >= 2 ? scoredBooks[0].book : kakaoBooks[0]
}

function normalizeMatchedBook(routeId: string, kakaoBook: KakaoBook, aladinItem: AladinItem) {
  const { isbn10, isbn13 } = getIsbnParts(kakaoBook.isbn)

  return {
    id: routeId,
    itemId: aladinItem.itemId ?? null,
    kakaoId: isbn13 || isbn10 || kakaoBook.url,
    title: stripTags(kakaoBook.title) || aladinItem.title || '제목 미상',
    author: kakaoBook.authors.join(', ') || aladinItem.author || '저자 미상',
    publisher: kakaoBook.publisher || aladinItem.publisher || '',
    publishedAt: kakaoBook.datetime || aladinItem.pubDate || '',
    description: kakaoBook.contents || aladinItem.description || '',
    thumbnailUrl: kakaoBook.thumbnail || aladinItem.cover || '',
    url: kakaoBook.url || aladinItem.link || '',
    isbn: isbn10 || aladinItem.isbn || '',
    isbn13: isbn13 || aladinItem.isbn13 || '',
    genre: getGenre(aladinItem.categoryName),
    categoryName: aladinItem.categoryName ?? '',
    rating: aladinItem.customerReviewRank ? aladinItem.customerReviewRank / 2 : null,
    reviewCount: null,
    bestRank: aladinItem.bestRank ?? null,
    source: 'kakao',
    matchedFrom: 'aladin',
  }
}

function normalizeAladinBook(routeId: string, aladinItem: AladinItem) {
  return {
    id: routeId,
    itemId: aladinItem.itemId ?? null,
    kakaoId: null,
    title: stripTags(aladinItem.title) || '?쒕ぉ 誘몄긽',
    author: aladinItem.author || '???誘몄긽',
    publisher: aladinItem.publisher ?? '',
    publishedAt: aladinItem.pubDate ?? '',
    description: aladinItem.description ?? '',
    thumbnailUrl: aladinItem.cover ?? '',
    url: aladinItem.link ?? '',
    isbn: aladinItem.isbn ?? '',
    isbn13: aladinItem.isbn13 ?? '',
    genre: getGenre(aladinItem.categoryName),
    categoryName: aladinItem.categoryName ?? '',
    rating: aladinItem.customerReviewRank ? aladinItem.customerReviewRank / 2 : null,
    reviewCount: null,
    bestRank: aladinItem.bestRank ?? null,
    source: 'aladin',
    matchedFrom: null,
  }
}

async function lookupAladinItem(ttbKey: string, itemId: string) {
  const query = new URLSearchParams({
    ttbkey: ttbKey,
    ItemId: itemId,
    ItemIdType: getItemIdType(itemId),
    output: 'js',
    Version: '20131101',
    Cover: 'Big',
    OptResult: 'ratingInfo',
  })
  const response = await fetch(`${ALADIN_ITEM_LOOKUP_URL}?${query.toString()}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch book detail from Aladin.')
  }

  const data = sanitizeAladinJson(await response.text())
  return data.item?.[0] ?? null
}

async function searchKakaoBooks(kakaoKey: string, aladinItem: AladinItem) {
  const queryText = stripTags(aladinItem.title ?? '')
  if (!queryText) return []

  const params = new URLSearchParams({
    query: queryText,
    sort: 'accuracy',
    page: '1',
    size: '20',
  })

  const response = await fetch(`${KAKAO_BOOK_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch matching book from Kakao.')
  }

  const data = (await response.json()) as KakaoResponse
  return data.documents ?? []
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const aladinKey = process.env.ALADIN_TTB_KEY ?? process.env.NEXT_PUBLIC_ALADIN_TTB_KEY
  const kakaoKey = process.env.KAKAO_REST_API_KEY ?? process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY

  if (!aladinKey) {
    return NextResponse.json(
      { error: 'ALADIN_TTB_KEY is required to load book detail.' },
      { status: 500 },
    )
  }

  const { id } = await params
  const routeId = decodeURIComponent(id)

  try {
    const aladinItem = await lookupAladinItem(aladinKey, routeId)
    if (!aladinItem) {
      return NextResponse.json({ error: 'Aladin source book not found.' }, { status: 404 })
    }

    if (kakaoKey) {
      try {
        const kakaoBooks = await searchKakaoBooks(kakaoKey, aladinItem)
        const matchedBook = findMatchingKakaoBook(kakaoBooks, aladinItem)

        if (matchedBook) {
          return NextResponse.json({ book: normalizeMatchedBook(routeId, matchedBook, aladinItem) })
        }
      } catch {
        return NextResponse.json({ book: normalizeAladinBook(routeId, aladinItem) })
      }
    }

    return NextResponse.json({ book: normalizeAladinBook(routeId, aladinItem) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load book detail.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
