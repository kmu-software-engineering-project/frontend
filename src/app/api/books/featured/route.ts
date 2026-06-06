import { NextResponse } from 'next/server'

const ALADIN_ITEM_LIST_URL = 'http://www.aladin.co.kr/ttb/api/ItemList.aspx'

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

function sanitizeAladinJson(text: string): AladinResponse {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('{') ? trimmed : trimmed.replace(/^[^(]*\(/, '').replace(/\);?$/, '')
  return JSON.parse(jsonText) as AladinResponse
}

function getGenre(categoryName = '') {
  const parts = categoryName.split('>').map((part) => part.trim()).filter(Boolean)
  return parts.find((part) => !['국내도서', '외국도서'].includes(part)) ?? '기타'
}

function normalizeItem(item: AladinItem, statusTag: '베스트셀러' | '신간') {
  const id = String(item.itemId ?? item.isbn13 ?? item.isbn ?? item.link ?? item.title)
  return {
    id,
    itemId: item.itemId ?? null,
    title: item.title ?? '제목 미상',
    author: item.author ?? '저자 미상',
    publisher: item.publisher ?? '',
    publishedAt: item.pubDate ?? '',
    description: item.description ?? '',
    thumbnailUrl: item.cover ?? '',
    url: item.link ?? '',
    isbn: item.isbn ?? '',
    isbn13: item.isbn13 ?? '',
    genre: getGenre(item.categoryName),
    categoryName: item.categoryName ?? '',
    rating: item.customerReviewRank ? item.customerReviewRank / 2 : null,
    reviewCount: null,
    statusTag,
    bestRank: item.bestRank ?? null,
  }
}

async function fetchAladinList(ttbKey: string, queryType: 'Bestseller' | 'ItemNewSpecial', limit: number) {
  const params = new URLSearchParams({
    ttbkey: ttbKey,
    QueryType: queryType,
    SearchTarget: 'Book',
    MaxResults: String(limit),
    start: '1',
    output: 'js',
    Version: '20131101',
    Cover: 'Big',
  })

  const response = await fetch(`${ALADIN_ITEM_LIST_URL}?${params.toString()}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Failed to fetch featured books from Aladin.')

  const data = sanitizeAladinJson(await response.text())
  return (data.item ?? []).map((item) => normalizeItem(item, queryType === 'Bestseller' ? '베스트셀러' : '신간'))
}

export async function GET() {
  const aladinKey = process.env.ALADIN_TTB_KEY ?? process.env.NEXT_PUBLIC_ALADIN_TTB_KEY

  if (!aladinKey) {
    return NextResponse.json(
      { error: 'ALADIN_TTB_KEY is required to load featured books.' },
      { status: 500 },
    )
  }

  try {
    const [bestsellers, newBooks] = await Promise.all([
      fetchAladinList(aladinKey, 'Bestseller', 8),
      fetchAladinList(aladinKey, 'ItemNewSpecial', 8),
    ])
    const books = Array.from(new Map([...bestsellers, ...newBooks].map((book) => [book.id, book])).values())

    return NextResponse.json({ books })
  } catch {
    return NextResponse.json({ error: 'Unable to load featured books.' }, { status: 502 })
  }
}
