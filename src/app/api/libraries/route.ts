import { NextResponse } from 'next/server'
import type { Library } from '@/types'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'
const DISTRICT_PATTERN = /서울특별시\s*([가-힣]+구)/

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, '')
}

function getBackendUrl(request: Request) {
  const backendUrl = normalizeOrigin(BACKEND_URL)
  const frontendOrigin = new URL(request.url).origin
  return backendUrl === frontendOrigin ? undefined : backendUrl
}

function getDistrict(address: string) {
  return address.match(DISTRICT_PATTERN)?.[1] ?? '기타'
}

function normalizeLibrary(lib: Record<string, unknown>): Library {
  const address = String(lib.address ?? '')
  let lat = Number(lib.lat ?? lib.latitude)
  let lng = Number(lib.lng ?? lib.longitude)

  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    ;[lat, lng] = [lng, lat]
  }

  return {
    id: String(lib.id ?? ''),
    name: String(lib.name ?? ''),
    address,
    neighborhood: String(lib.neighborhood ?? getDistrict(address)),
    phone: lib.phone as string | undefined,
    homepage: lib.homepage as string | undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  }
}

function getLibraryItems(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (!raw || typeof raw !== 'object') return []

  const data = raw as Record<string, unknown>
  const candidates = [data.results, data.libraries, data.data, data.items]
  const list = candidates.find(Array.isArray)
  return (list ?? []) as Record<string, unknown>[]
}

export async function GET(request: Request) {
  const backendUrl = getBackendUrl(request)
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL must point to the backend server, not the frontend server.' }, { status: 500 })
  }

  try {
    const response = await fetch(`${backendUrl}/api/v1/libraries/`, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ error: '도서관 목록을 불러오지 못했습니다.' }, { status: response.status })
    }
    const raw = await response.json()
    const libraries = getLibraryItems(raw).map(normalizeLibrary)
    return NextResponse.json(libraries)
  } catch {
    return NextResponse.json({ error: '도서관 목록을 불러오지 못했습니다.' }, { status: 502 })
  }
}
