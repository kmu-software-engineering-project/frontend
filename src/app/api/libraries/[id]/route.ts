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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backendUrl = getBackendUrl(request)
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL must point to the backend server, not the frontend server.' }, { status: 500 })
  }

  try {
    const { id } = await params
    const response = await fetch(`${backendUrl}/api/v1/libraries/${id}/`, { cache: 'no-store' })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: '도서관 정보를 불러오지 못했습니다.' }, { status: 502 })
  }
}
