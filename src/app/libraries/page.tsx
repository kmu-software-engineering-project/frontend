import LibrariesMap from './LibrariesMap'
import { MOCK_LIBRARIES } from '@/lib/mock'
import type { Library } from '@/types'

const BACKEND_URL = process.env.BACKEND_URL
const REQUEST_TIMEOUT_MS = 5000
const DISTRICT_PATTERN = /서울특별시\s*([가-힣]+구)/

function getBackendUrl() {
  return BACKEND_URL?.replace(/\/$/, '')
}

function getCoordinates(lib: Record<string, unknown>) {
  let lat = Number(lib.lat ?? lib.latitude)
  let lng = Number(lib.lng ?? lib.longitude)

  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    ;[lat, lng] = [lng, lat]
  }

  return {
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  }
}

function getDistrict(address: string) {
  return address.match(DISTRICT_PATTERN)?.[1] ?? '기타'
}

function normalizeLibrary(lib: Record<string, unknown>): Library {
  const { lat, lng } = getCoordinates(lib)
  const address = String(lib.address ?? '')

  return {
    id: String(lib.id ?? ''),
    name: String(lib.name ?? ''),
    address,
    neighborhood: String(lib.neighborhood ?? getDistrict(address)),
    phone: lib.phone as string | undefined,
    homepage: lib.homepage as string | undefined,
    lat,
    lng,
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

async function fetchLibraries(): Promise<Library[]> {
  const backendUrl = getBackendUrl()
  if (!backendUrl) return MOCK_LIBRARIES

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const response = await fetch(`${backendUrl}/api/v1/libraries/`, { cache: 'no-store', signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) return MOCK_LIBRARIES
    const raw = await response.json()
    const libraries = getLibraryItems(raw).map(normalizeLibrary)
    return libraries.length > 0 ? libraries : MOCK_LIBRARIES
  } catch {
    return MOCK_LIBRARIES
  }
}

async function fetchMapApiKey(): Promise<string | undefined> {
  const backendUrl = getBackendUrl()
  if (!backendUrl) return undefined

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const response = await fetch(`${backendUrl}/api/v1/libraries/map-config/`, { cache: 'no-store', signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) return undefined
    const data = (await response.json()) as Record<string, unknown>
    return (
      data.kakao_javascript_key ??
      data.kakao_map_api_key ??
      data.kakao_key ??
      data.kakaoKey ??
      data.api_key ??
      data.apiKey ??
      data.key
    ) as string | undefined
  } catch {
    return undefined
  }
}

export default async function LibrariesPage() {
  const [libraries, backendMapKey] = await Promise.all([fetchLibraries(), fetchMapApiKey()])

  return (
    <div className="page-shell py-12">
      <div className="mb-8 max-w-3xl">
        <p className="eyebrow">Library</p>
        <h1 className="mt-2 text-4xl font-light tracking-tight text-stone-950">가까운 도서관 찾기</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          서울특별시 주소의 구 단위로 도서관을 분류해 원하는 지역의 도서관 이름, 주소, 문의 번호,
          홈페이지를 빠르게 찾아볼 수 있습니다.
        </p>
      </div>

      <LibrariesMap libraries={libraries} mapApiKey={backendMapKey} />
    </div>
  )
}
