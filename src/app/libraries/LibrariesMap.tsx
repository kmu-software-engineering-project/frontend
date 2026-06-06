'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Library } from '@/types'

type KakaoLatLng = unknown
type KakaoMap = {
  setCenter: (latLng: KakaoLatLng) => void
  setLevel: (level: number) => void
}
type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void
}

declare global {
  interface Window {
    kakao?: {
      maps: {
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        LatLngBounds: new () => {
          extend: (latLng: KakaoLatLng) => void
        }
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
        Marker: new (options: { map: KakaoMap; position: KakaoLatLng; title?: string }) => KakaoMarker
        event: {
          addListener: (target: KakaoMarker, eventName: string, callback: () => void) => void
        }
        load: (callback: () => void) => void
      }
    }
  }
}

const ALL_DISTRICTS = '전체'
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 }

function loadKakaoMapsSafely(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    let settled = false

    const finish = () => {
      if (settled) return
      const maps = window.kakao?.maps
      if (!maps) {
        settled = true
        reject(new Error('Kakao 지도 SDK를 초기화하지 못했습니다. JavaScript 키 설정을 확인해 주세요.'))
        return
      }

      maps.load(() => {
        if (settled) return
        settled = true
        resolve()
      })
    }

    if (window.kakao?.maps) {
      finish()
      return
    }

    document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]')?.remove()

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(apiKey)}&autoload=false`
    script.async = true
    script.dataset.kakaoMapSdk = 'true'
    script.onload = finish
    script.onerror = () => {
      if (settled) return
      settled = true
      reject(new Error('Kakao 지도 SDK를 불러오지 못했습니다. 네트워크와 키 등록 도메인을 확인해 주세요.'))
    }
    document.head.appendChild(script)

    window.setTimeout(() => {
      if (settled) return
      settled = true
      script.remove()
      reject(new Error('Kakao 지도 SDK 로딩 시간이 초과되었습니다.'))
    }, 10000)
  })
}

function formatHomepage(homepage?: string) {
  if (!homepage) return undefined
  return homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export default function LibrariesMap({ libraries, mapApiKey }: { libraries: Library[]; mapApiKey?: string }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const markerRefs = useRef<KakaoMarker[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState(ALL_DISTRICTS)
  const [selectedLibraryId, setSelectedLibraryId] = useState(libraries[0]?.id ?? '')
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const districts = useMemo(
    () => [ALL_DISTRICTS, ...Array.from(new Set(libraries.map((library) => library.neighborhood))).sort()],
    [libraries],
  )

  const filteredLibraries = useMemo(() => {
    if (selectedDistrict === ALL_DISTRICTS) return libraries
    return libraries.filter((library) => library.neighborhood === selectedDistrict)
  }, [libraries, selectedDistrict])

  const selectedLibrary = useMemo(() => {
    return filteredLibraries.find((library) => library.id === selectedLibraryId) ?? filteredLibraries[0]
  }, [filteredLibraries, selectedLibraryId])

  useEffect(() => {
    if (!filteredLibraries.some((library) => library.id === selectedLibraryId)) {
      setSelectedLibraryId(filteredLibraries[0]?.id ?? '')
    }
  }, [filteredLibraries, selectedLibraryId])

  useEffect(() => {
    if (!mapApiKey) {
      setMapError('Kakao 지도 API 키가 설정되지 않았습니다.')
      return
    }

    let isMounted = true

    setMapError(null)

    loadKakaoMapsSafely(mapApiKey)
      .then(() => {
        if (!isMounted || !mapContainerRef.current || !window.kakao?.maps) return

        const center = new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng)
        mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, { center, level: 8 })
        setIsMapReady(true)
      })
      .catch((error: Error) => {
        if (isMounted) setMapError(error.message)
      })

    return () => {
      isMounted = false
    }
  }, [mapApiKey])

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao?.maps) return

    markerRefs.current.forEach((marker) => marker.setMap(null))
    markerRefs.current = []

    const bounds = new window.kakao.maps.LatLngBounds()
    filteredLibraries.forEach((library) => {
      if (!library.lat || !library.lng || !mapRef.current || !window.kakao?.maps) return

      const position = new window.kakao.maps.LatLng(library.lat, library.lng)
      const marker = new window.kakao.maps.Marker({
        map: mapRef.current,
        position,
        title: library.name,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => setSelectedLibraryId(library.id))
      markerRefs.current.push(marker)
      bounds.extend(position)
    })

    if (selectedLibrary?.lat && selectedLibrary.lng) {
      mapRef.current.setCenter(new window.kakao.maps.LatLng(selectedLibrary.lat, selectedLibrary.lng))
      mapRef.current.setLevel(selectedDistrict === ALL_DISTRICTS ? 8 : 5)
    }
  }, [filteredLibraries, isMapReady, selectedLibrary, selectedDistrict])

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="overflow-hidden rounded-lg border border-stone-900/10 bg-white/70 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-900/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Map</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-950">구별 도서관 지도</h2>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
            지역
            <select
              value={selectedDistrict}
              onChange={(event) => setSelectedDistrict(event.target.value)}
              className="h-10 rounded-full border border-stone-900/10 bg-white px-4 text-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relative bg-primary-50">
          <div ref={mapContainerRef} style={{ width: '100%', height: '28rem' }} aria-label="도서관 지도" />
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary-50/95 px-6 text-center text-sm font-medium text-stone-600">
              {mapError}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4 max-h-[33rem] overflow-y-auto scrollbar-hide">
        {selectedLibrary && (
          <article className="rounded-lg border border-stone-900/10 bg-stone-950 p-5 text-white shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-200">Selected</p>
            <h2 className="mt-3 text-xl font-semibold">{selectedLibrary.name}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-200">{selectedLibrary.address}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-400">지역</dt>
                <dd className="font-medium">{selectedLibrary.neighborhood}</dd>
              </div>
              {selectedLibrary.phone && (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-400">문의 번호</dt>
                  <dd className="font-medium">{selectedLibrary.phone}</dd>
                </div>
              )}
              {selectedLibrary.homepage && (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-400">홈페이지</dt>
                  <dd className="text-right font-medium">
                    <a
                      href={selectedLibrary.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-white/40 underline-offset-4 transition hover:text-primary-100"
                    >
                      {formatHomepage(selectedLibrary.homepage)}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </article>
        )}

        <div className="space-y-3">
          {filteredLibraries.map((library) => {
            const isSelected = library.id === selectedLibrary?.id

            return (
              <button
                key={library.id}
                type="button"
                onClick={() => setSelectedLibraryId(library.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? 'border-primary-400 bg-primary-50 shadow-sm'
                    : 'border-stone-900/10 bg-white/70 hover:border-primary-300 hover:bg-white'
                }`}
              >
                <span className="text-xs font-semibold text-primary-700">{library.neighborhood}</span>
                <span className="mt-2 block text-base font-semibold text-stone-950">{library.name}</span>
                <span className="mt-2 block text-sm leading-5 text-stone-600">{library.address}</span>
                {library.phone && <span className="mt-3 block text-sm font-medium text-stone-800">문의 번호 {library.phone}</span>}
                {library.homepage && (
                  <span className="mt-2 block text-sm font-medium text-primary-700">{formatHomepage(library.homepage)}</span>
                )}
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
