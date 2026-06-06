import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  try {
    const params = new URLSearchParams({ title })
    const author = searchParams.get('author')
    if (author) params.set('author', author)
    const isbn = searchParams.get('isbn')
    if (isbn) params.set('isbn', isbn)

    const res = await fetch(`${BACKEND_URL}/api/v1/bookstores/prices/?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch store prices' }, { status: 500 })
  }
}
