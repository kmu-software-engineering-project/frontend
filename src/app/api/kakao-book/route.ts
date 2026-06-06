import { NextResponse } from 'next/server'

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY ?? ''
const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY ?? ''

interface BookData {
  thumbnail: string | null
  description: string | null
}

async function searchKakao(query: string): Promise<BookData | null> {
  if (!KAKAO_API_KEY) return null
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&target=title&size=1`,
      { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const book = data.documents?.[0]
    if (!book) return null
    return {
      thumbnail: (book.thumbnail as string) || null,
      description: (book.contents as string) || null,
    }
  } catch {
    return null
  }
}

async function searchAladin(query: string): Promise<BookData | null> {
  if (!ALADIN_TTB_KEY) return null
  try {
    const url = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?TTBKey=${ALADIN_TTB_KEY}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=1&SearchTarget=Book&output=js&Version=20131101`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const item = data.item?.[0]
    if (!item) return null
    const cover = (item.cover as string) || null
    return {
      thumbnail: cover ? cover.replace('http://', 'https://') : null,
      description: (item.description as string) || null,
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json(null)

  const kakao = await searchKakao(query)

  // Kakao found a thumbnail — return it (with its description)
  if (kakao?.thumbnail) return NextResponse.json(kakao)

  // Kakao had no thumbnail — try Aladin
  const aladin = await searchAladin(query)

  if (aladin?.thumbnail) {
    return NextResponse.json({
      thumbnail: aladin.thumbnail,
      // Prefer Kakao description if it exists (often richer)
      description: kakao?.description ?? aladin.description,
    })
  }

  // Neither API returned a thumbnail — return any description we scraped, or null
  const description = kakao?.description ?? aladin?.description ?? null
  return NextResponse.json(description ? { thumbnail: null, description } : null)
}
