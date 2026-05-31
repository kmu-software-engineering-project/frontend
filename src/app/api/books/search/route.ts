import { NextResponse } from 'next/server'

const KAKAO_BOOK_SEARCH_URL = 'https://dapi.kakao.com/v3/search/book'
const ALADIN_ITEM_LOOKUP_URL = 'http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx'
const ALADIN_ITEM_SEARCH_URL = 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx'
const KAKAO_PAGE_SIZE = 50
const KAKAO_LAST_PAGE = 50

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
  meta: {
    is_end: boolean
  }
  documents: KakaoBook[]
}

type AladinItem = {
  title?: string
  author?: string
  isbn?: string
  isbn13?: string
  categoryId?: number
  categoryName?: string
}

type AladinResponse = {
  item?: AladinItem[]
}

type GenreKey =
  | '소설'
  | '시/에세이'
  | '자기계발'
  | '경제/경영'
  | '인문'
  | '사회/정치'
  | '과학'
  | '예술'
  | '어린이'
  | '기타'

const CATEGORY_RULES: Array<{ genre: GenreKey; keywords: string[] }> = [
  { genre: '소설', keywords: ['소설', '장르소설', '라이트 노벨'] },
  { genre: '시/에세이', keywords: ['시', '에세이'] },
  { genre: '자기계발', keywords: ['자기계발', '성공', '처세'] },
  { genre: '경제/경영', keywords: ['경제', '경영', '투자', '재테크'] },
  { genre: '인문', keywords: ['인문', '철학', '심리', '역사', '종교'] },
  { genre: '사회/정치', keywords: ['사회', '정치', '법', '교육'] },
  { genre: '과학', keywords: ['과학', '공학', '컴퓨터', 'IT'] },
  { genre: '예술', keywords: ['예술', '대중문화', '음악', '미술', '건축'] },
  { genre: '어린이', keywords: ['어린이', '유아', '청소년', '초등'] },
]

function sanitizeAladinJson(text: string): AladinResponse {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : trimmed.replace(/^[^(]*\(/, '').replace(/\);?$/, '')

  return JSON.parse(jsonText) as AladinResponse
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function getIsbnParts(isbn: string) {
  const parts = isbn
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    isbn10: parts.find((part) => part.length === 10),
    isbn13: parts.find((part) => part.length === 13),
  }
}

function normalizeComparable(value: string) {
  return stripTags(value).toLowerCase().replace(/\s+/g, '')
}

function pickGenre(categoryName?: string): GenreKey {
  if (!categoryName) return '기타'

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => categoryName.includes(keyword))) {
      return rule.genre
    }
  }

  return '기타'
}

function getNumberParam(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.floor(parsed), min), max)
}

async function lookupAladinByIsbn(ttbKey: string, isbn: string) {
  const { isbn10, isbn13 } = getIsbnParts(isbn)
  const itemId = isbn13 ?? isbn10
  if (!itemId) return null

  const params = new URLSearchParams({
    ttbkey: ttbKey,
    itemIdType: isbn13 ? 'ISBN13' : 'ISBN',
    ItemId: itemId,
    output: 'js',
    Version: '20131101',
    OptResult: 'categoryIdList',
  })

  const response = await fetch(`${ALADIN_ITEM_LOOKUP_URL}?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) return null

  const data = sanitizeAladinJson(await response.text())
  return data.item?.[0] ?? null
}

async function searchAladinByTitleAndAuthor(ttbKey: string, book: KakaoBook) {
  const title = stripTags(book.title)
  const author = book.authors[0] ?? ''
  if (!title || !author) return null

  const params = new URLSearchParams({
    ttbkey: ttbKey,
    Query: title,
    QueryType: 'Title',
    SearchTarget: 'Book',
    MaxResults: '10',
    start: '1',
    output: 'js',
    Version: '20131101',
  })

  const response = await fetch(`${ALADIN_ITEM_SEARCH_URL}?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) return null

  const data = sanitizeAladinJson(await response.text())
  const normalizedTitle = normalizeComparable(title)
  const normalizedAuthor = normalizeComparable(author)

  return (
    data.item?.find((item) => {
      const itemTitle = normalizeComparable(item.title ?? '')
      const itemAuthor = normalizeComparable(item.author ?? '')
      return itemTitle.includes(normalizedTitle) && itemAuthor.includes(normalizedAuthor)
    }) ??
    data.item?.[0] ??
    null
  )
}

async function enrichBook(ttbKey: string | undefined, book: KakaoBook) {
  let aladinItem: AladinItem | null = null

  if (ttbKey) {
    try {
      aladinItem =
        (await lookupAladinByIsbn(ttbKey, book.isbn)) ??
        (await searchAladinByTitleAndAuthor(ttbKey, book))
    } catch {
      aladinItem = null
    }
  }

  const { isbn10, isbn13 } = getIsbnParts(book.isbn)
  const categoryName = aladinItem?.categoryName ?? ''

  return {
    id: isbn13 ?? isbn10 ?? book.url ?? `${book.title}-${book.datetime}`,
    title: stripTags(book.title),
    contents: book.contents,
    url: book.url,
    isbn: book.isbn,
    isbn10: isbn10 ?? aladinItem?.isbn ?? '',
    isbn13: isbn13 ?? aladinItem?.isbn13 ?? '',
    publishedAt: book.datetime,
    authors: book.authors,
    publisher: book.publisher,
    price: book.price,
    salePrice: book.sale_price,
    thumbnail: book.thumbnail,
    status: book.status,
    genre: pickGenre(categoryName),
    aladinCategoryId: aladinItem?.categoryId ?? null,
    aladinCategoryName: categoryName,
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const currentIndex = index
      index += 1
      results[currentIndex] = await mapper(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export async function GET(request: Request) {
  const kakaoKey = process.env.KAKAO_REST_API_KEY ?? process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  const aladinKey = process.env.ALADIN_TTB_KEY ?? process.env.NEXT_PUBLIC_ALADIN_TTB_KEY

  if (!kakaoKey) {
    return NextResponse.json(
      { error: 'KAKAO_REST_API_KEY is required to search books.' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim() || '책'
  const startPage = getNumberParam(searchParams.get('page'), 1, 1, KAKAO_LAST_PAGE)
  const limit = getNumberParam(searchParams.get('limit'), 200, 1, 200)
  const pageCount = Math.ceil(limit / KAKAO_PAGE_SIZE)

  try {
    const books: KakaoBook[] = []
    let nextPage = startPage
    let isEnd = startPage > KAKAO_LAST_PAGE

    for (
      let page = startPage;
      page < startPage + pageCount && page <= KAKAO_LAST_PAGE && books.length < limit;
      page += 1
    ) {
      const params = new URLSearchParams({
        query,
        sort: 'latest',
        page: String(page),
        size: String(KAKAO_PAGE_SIZE),
      })

      const response = await fetch(`${KAKAO_BOOK_SEARCH_URL}?${params.toString()}`, {
        headers: {
          Authorization: `KakaoAK ${kakaoKey}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch books from Kakao.' },
          { status: response.status },
        )
      }

      const data = (await response.json()) as KakaoResponse
      books.push(...data.documents)
      nextPage = page + 1
      isEnd = data.meta.is_end || nextPage > KAKAO_LAST_PAGE

      if (data.meta.is_end) break
    }

    const uniqueBooks = Array.from(
      new Map(books.map((book) => [getIsbnParts(book.isbn).isbn13 ?? book.url, book])).values(),
    )
      .sort((first, second) => second.datetime.localeCompare(first.datetime))
      .slice(0, limit)

    const enrichedBooks = await mapWithConcurrency(uniqueBooks, 8, (book) =>
      enrichBook(aladinKey, book),
    )

    return NextResponse.json({
      books: enrichedBooks,
      nextPage,
      isEnd,
      hasAladinKey: Boolean(aladinKey),
    })
  } catch {
    return NextResponse.json({ error: 'Unable to search books.' }, { status: 502 })
  }
}
