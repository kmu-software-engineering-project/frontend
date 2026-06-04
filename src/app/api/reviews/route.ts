import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, '')
}

function getBackendUrl(request: Request) {
  const backendUrl = normalizeOrigin(BACKEND_URL)
  const frontendOrigin = new URL(request.url).origin
  return backendUrl === frontendOrigin ? undefined : backendUrl
}

export async function GET(request: Request) {
  const backendUrl = getBackendUrl(request)
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL must point to the backend server, not the frontend server.' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('book_id')

  try {
    const params = new URLSearchParams()
    if (bookId) params.set('book_id', bookId)

    const response = await fetch(`${backendUrl}/api/v1/reviews/?${params}`, { cache: 'no-store' })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: '리뷰를 불러오지 못했습니다.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const backendUrl = getBackendUrl(request)
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL must point to the backend server, not the frontend server.' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const response = await fetch(`${backendUrl}/api/v1/reviews/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: '리뷰를 등록하지 못했습니다.' }, { status: 502 })
  }
}
