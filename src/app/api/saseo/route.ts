import { NextResponse } from 'next/server'

const SASEO_API_URL = 'https://nl.go.kr/NL/search/openApi/saseoApi.do'

export async function GET(request: Request) {
  const apiKey = process.env.NL_SASEO_API_KEY ?? process.env.NEXT_PUBLIC_NL_SASEO_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'NL_SASEO_API_KEY is required to use the librarian recommendation API.' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const drCode = searchParams.get('drCode') ?? '11'
  const startRowNumApi = searchParams.get('startRowNumApi') ?? '1'
  const endRowNumApi =
    searchParams.get('endRowNumApi') ?? searchParams.get('endRowNemApi') ?? '20'

  const upstreamParams = new URLSearchParams({
    key: apiKey,
    drCode,
    startRowNumApi,
    endRowNumApi,
  })

  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  if (startDate) upstreamParams.set('start_date', startDate)
  if (endDate) upstreamParams.set('end_date', endDate)

  try {
    const response = await fetch(`${SASEO_API_URL}?${upstreamParams.toString()}`, {
      cache: 'no-store',
    })

    const xml = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch librarian recommendations.' },
        { status: response.status },
      )
    }

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Unable to connect to the librarian recommendation API.' },
      { status: 502 },
    )
  }
}
