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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const backendUrl = getBackendUrl(request)
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL must point to the backend server, not the frontend server.' }, { status: 500 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const response = await fetch(`${backendUrl}/api/v1/reviews/${id}/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: '리뷰를 삭제하지 못했습니다.' }, { status: 502 })
  }
}
