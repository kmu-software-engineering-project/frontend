'use client'

import { useState } from 'react'
import BookCard from '@/components/BookCard'
import { GENRES, MOCK_BOOKS } from '@/lib/mock'
import { Genre } from '@/types'

const GENRE_ICONS: Record<string, string> = {
  소설: '📖',
  인문: '🧠',
  과학: '🔭',
  역사: '🏛️',
  자기계발: '🌱',
  예술: '🎨',
  경제: '💰',
  기타: '📚',
}

export default function GenresPage() {
  const [selected, setSelected] = useState<Genre | null>(null)

  const filtered = selected ? MOCK_BOOKS.filter((b) => b.genre === selected) : MOCK_BOOKS

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="section-title">장르별 도서</h1>

      {/* 장르 필터 탭 */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setSelected(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === null
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
          }`}
        >
          전체
        </button>
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelected(genre)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              selected === genre
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
            }`}
          >
            <span>{GENRE_ICONS[genre]}</span>
            {genre}
          </button>
        ))}
      </div>

      {/* 도서 목록 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>해당 장르의 도서가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
