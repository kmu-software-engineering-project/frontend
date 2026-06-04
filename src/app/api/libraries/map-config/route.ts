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

  try {
    const response = await fetch(`${backendUrl}/api/v1/libraries/map-config/`, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ error: '지도 설정을 불러오지 못했습니다.' }, { status: response.status })
    }
    const data = await response.json()
    const key =
      data.kakao_javascript_key ??
      data.kakao_map_api_key ??
      data.kakao_key ??
      data.kakaoKey ??
      data.api_key ??
      data.apiKey ??
      data.key

    return NextResponse.json({ ...data, key })
  } catch {
    return NextResponse.json({ error: '지도 설정을 불러오지 못했습니다.' }, { status: 502 })
  }
}
