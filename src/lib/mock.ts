import { Book, Genre, Review, Library } from '@/types'

export const GENRES: Genre[] = ['소설', '인문', '과학', '역사', '자기계발', '예술', '경제', '기타']

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: '채식주의자',
    author: '한강',
    genre: '소설',
    rating: 4.5,
    thumbnailUrl: 'https://picsum.photos/seed/book1/200/280',
    description: '인간의 폭력성과 채식이라는 선택을 통해 자유를 갈망하는 이야기',
    publishedYear: 2007,
  },
  {
    id: '2',
    title: '코스모스',
    author: '칼 세이건',
    genre: '과학',
    rating: 4.8,
    thumbnailUrl: 'https://picsum.photos/seed/book2/200/280',
    description: '우주의 장대한 역사를 쉽고 아름답게 풀어낸 과학 교양서',
    publishedYear: 1980,
  },
  {
    id: '3',
    title: '총, 균, 쇠',
    author: '재레드 다이아몬드',
    genre: '역사',
    rating: 4.6,
    thumbnailUrl: 'https://picsum.photos/seed/book3/200/280',
    description: '인류 문명의 불평등한 발전을 환경적 관점에서 분석한 역작',
    publishedYear: 1997,
  },
  {
    id: '4',
    title: '아몬드',
    author: '손원평',
    genre: '소설',
    rating: 4.3,
    thumbnailUrl: 'https://picsum.photos/seed/book4/200/280',
    description: '감정을 느끼지 못하는 소년이 세상과 연결되어 가는 성장 소설',
    publishedYear: 2017,
  },
  {
    id: '5',
    title: '사피엔스',
    author: '유발 하라리',
    genre: '인문',
    rating: 4.7,
    thumbnailUrl: 'https://picsum.photos/seed/book5/200/280',
    description: '호모 사피엔스의 탄생부터 현재까지를 거시적으로 조망하는 역작',
    publishedYear: 2011,
  },
  {
    id: '6',
    title: '미움받을 용기',
    author: '기시미 이치로',
    genre: '자기계발',
    rating: 4.4,
    thumbnailUrl: 'https://picsum.photos/seed/book6/200/280',
    description: '아들러 심리학을 대화 형식으로 풀어낸 자기계발서',
    publishedYear: 2013,
  },
  {
    id: '7',
    title: '돈의 심리학',
    author: '모건 하우절',
    genre: '경제',
    rating: 4.5,
    thumbnailUrl: 'https://picsum.photos/seed/book7/200/280',
    description: '부와 행복에 대한 인간의 심리를 통찰한 금융 에세이',
    publishedYear: 2020,
  },
  {
    id: '8',
    title: '82년생 김지영',
    author: '조남주',
    genre: '소설',
    rating: 4.2,
    thumbnailUrl: 'https://picsum.photos/seed/book8/200/280',
    description: '한국 사회 여성의 삶을 담담하게 그린 소설',
    publishedYear: 2016,
  },
]

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    bookId: '1',
    bookTitle: '채식주의자',
    author: '독자A',
    rating: 5,
    content: '읽는 내내 불편함과 아름다움이 공존했습니다. 오랫동안 기억에 남을 작품.',
    createdAt: '2026-04-10',
  },
  {
    id: 'r2',
    bookId: '2',
    bookTitle: '코스모스',
    author: '독자B',
    rating: 5,
    content: '우주에 대한 경이로움을 일깨워준 책. 칼 세이건의 문장은 시처럼 아름답습니다.',
    createdAt: '2026-04-15',
  },
  {
    id: 'r3',
    bookId: '5',
    bookTitle: '사피엔스',
    author: '독자C',
    rating: 4,
    content: '인류의 역사를 이렇게 짧고 명쾌하게 설명할 수 있다니. 통찰력이 놀랍습니다.',
    createdAt: '2026-04-20',
  },
  {
    id: 'r4',
    bookId: '6',
    bookTitle: '미움받을 용기',
    author: '독자D',
    rating: 4,
    content: '아들러 심리학을 처음 접했는데, 삶을 바라보는 시각이 달라졌습니다.',
    createdAt: '2026-05-01',
  },
]

export const MOCK_LIBRARIES: Library[] = [
  {
    id: 'lib1',
    name: '서울 중앙도서관',
    address: '서울특별시 서초구 반포대로 201',
    phone: '02-535-4141',
    lat: 37.4813,
    lng: 126.9815,
  },
  {
    id: 'lib2',
    name: '국립중앙도서관',
    address: '서울특별시 서초구 반포대로 201',
    phone: '02-535-4142',
    lat: 37.499,
    lng: 126.9784,
  },
  {
    id: 'lib3',
    name: '마포구립도서관',
    address: '서울특별시 마포구 독막로 324',
    phone: '02-3153-0100',
    lat: 37.5492,
    lng: 126.9017,
  },
  {
    id: 'lib4',
    name: '성북구립도서관',
    address: '서울특별시 성북구 보문로 168',
    phone: '02-6906-0050',
    lat: 37.5894,
    lng: 127.0165,
  },
]

export function getBooksByGenre(genre: Genre): Book[] {
  return MOCK_BOOKS.filter((b) => b.genre === genre)
}

export function getBookById(id: string): Book | undefined {
  return MOCK_BOOKS.find((b) => b.id === id)
}

export function getReviewsByBookId(bookId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.bookId === bookId)
}
