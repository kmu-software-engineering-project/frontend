export type Genre = '소설' | '인문' | '과학' | '역사' | '자기계발' | '예술' | '경제' | '기타'

export interface Book {
  id: string
  title: string
  author: string
  genre: Genre
  rating: number
  thumbnailUrl?: string
  description?: string
  publishedYear?: number
}

export interface Review {
  id: string
  bookId: string
  bookTitle: string
  author: string
  rating: number
  content: string
  createdAt: string
}

export interface Library {
  id: string
  name: string
  address: string
  phone?: string
  lat?: number
  lng?: number
}

// A 담당 영역 — 타입 정의만 여기에, 구현은 A가 별도 파일에서 작업
export interface RecommendInput {
  genre?: Genre
  keywords?: string[]
  mood?: string
}

export interface RecommendedBook extends Book {
  reason: string
}
