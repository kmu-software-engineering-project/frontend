import { Book, Genre, Library, Review } from '@/types'

export const GENRES: Genre[] = ['소설', '인문', '과학', '역사', '자기계발', '예술', '경제', '기타']

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: '채식주의자',
    author: '한강',
    genre: '소설',
    rating: 4.5,
    thumbnailUrl: 'https://picsum.photos/seed/book1/200/280',
    description: '일상의 균열과 선택을 통해 인간의 자유를 날카롭게 묻는 소설입니다.',
    publishedYear: 2007,
  },
  {
    id: '2',
    title: '코스모스',
    author: '칼 세이건',
    genre: '과학',
    rating: 4.8,
    thumbnailUrl: 'https://picsum.photos/seed/book2/200/280',
    description: '우주와 생명의 역사를 넓고 아름다운 언어로 풀어낸 과학 고전입니다.',
    publishedYear: 1980,
  },
  {
    id: '3',
    title: '총, 균, 쇠',
    author: '재레드 다이아몬드',
    genre: '역사',
    rating: 4.6,
    thumbnailUrl: 'https://picsum.photos/seed/book3/200/280',
    description: '문명 발전의 차이를 환경과 지리의 관점에서 해석한 대표작입니다.',
    publishedYear: 1997,
  },
  {
    id: '4',
    title: '아몬드',
    author: '손원평',
    genre: '소설',
    rating: 4.3,
    thumbnailUrl: 'https://picsum.photos/seed/book4/200/280',
    description: '감정을 느끼기 어려운 소년이 관계 속에서 성장하는 이야기입니다.',
    publishedYear: 2017,
  },
  {
    id: '5',
    title: '사피엔스',
    author: '유발 하라리',
    genre: '인문',
    rating: 4.7,
    thumbnailUrl: 'https://picsum.photos/seed/book5/200/280',
    description: '인류의 출현부터 현대까지를 거시적인 시야로 정리한 인문 교양서입니다.',
    publishedYear: 2011,
  },
  {
    id: '6',
    title: '미움받을 용기',
    author: '기시미 이치로',
    genre: '자기계발',
    rating: 4.4,
    thumbnailUrl: 'https://picsum.photos/seed/book6/200/280',
    description: '아들러 심리학을 대화 형식으로 풀어낸 자기계발서입니다.',
    publishedYear: 2013,
  },
  {
    id: '7',
    title: '돈의 심리학',
    author: '모건 하우절',
    genre: '경제',
    rating: 4.5,
    thumbnailUrl: 'https://picsum.photos/seed/book7/200/280',
    description: '돈과 투자에 관한 인간의 태도를 담백하게 설명합니다.',
    publishedYear: 2020,
  },
  {
    id: '8',
    title: '82년생 김지영',
    author: '조남주',
    genre: '소설',
    rating: 4.2,
    thumbnailUrl: 'https://picsum.photos/seed/book8/200/280',
    description: '한국 사회의 일상적인 구조와 여성의 삶을 담은 소설입니다.',
    publishedYear: 2016,
  },
]

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    bookId: '1',
    bookTitle: '채식주의자',
    author: '독자 A',
    rating: 5,
    content: '불편함과 아름다움이 동시에 남는 작품이었습니다. 오래 생각하게 됩니다.',
    createdAt: '2026-04-10',
  },
  {
    id: 'r2',
    bookId: '2',
    bookTitle: '코스모스',
    author: '독자 B',
    rating: 5,
    content: '우주를 바라보는 감각을 넓혀 주는 책입니다. 문장이 맑고 장엄합니다.',
    createdAt: '2026-04-15',
  },
  {
    id: 'r3',
    bookId: '5',
    bookTitle: '사피엔스',
    author: '독자 C',
    rating: 4,
    content: '인류사를 빠르게 훑으면서도 관점을 선명하게 제시합니다.',
    createdAt: '2026-04-20',
  },
  {
    id: 'r4',
    bookId: '6',
    bookTitle: '미움받을 용기',
    author: '독자 D',
    rating: 4,
    content: '익숙한 고민을 다른 각도에서 보게 해주는 책입니다.',
    createdAt: '2026-05-01',
  },
]

export const MOCK_LIBRARIES: Library[] = [
  {
    id: 'lib1',
    name: '국립중앙도서관',
    address: '서울특별시 서초구 반포대로 201',
    neighborhood: '서초구',
    hours: '09:00 - 18:00',
    closedDays: '매월 둘째, 넷째 월요일',
    phone: '02-535-4141',
    lat: 37.4813,
    lng: 126.9815,
  },
  {
    id: 'lib2',
    name: '서초구립반포도서관',
    address: '서울특별시 서초구 고무래로 34',
    neighborhood: '서초구',
    hours: '09:00 - 22:00',
    closedDays: '매주 금요일',
    phone: '02-520-8700',
    lat: 37.5021,
    lng: 127.0122,
  },
  {
    id: 'lib3',
    name: '마포중앙도서관',
    address: '서울특별시 마포구 성산로 128',
    neighborhood: '마포구',
    hours: '09:00 - 22:00',
    closedDays: '매주 월요일',
    phone: '02-3153-0100',
    lat: 37.5637,
    lng: 126.9084,
  },
  {
    id: 'lib4',
    name: '성북정보도서관',
    address: '서울특별시 성북구 화랑로18자길 13',
    neighborhood: '성북구',
    hours: '09:00 - 18:00',
    closedDays: '매월 첫째, 셋째 월요일',
    phone: '02-6906-0050',
    lat: 37.6044,
    lng: 127.0417,
  },
  {
    id: 'lib5',
    name: '강남구립못골도서관',
    address: '서울특별시 강남구 자곡로 116',
    neighborhood: '강남구',
    hours: '09:00 - 22:00',
    closedDays: '매주 화요일',
    phone: '02-459-5522',
    lat: 37.4723,
    lng: 127.0964,
  },
  {
    id: 'lib6',
    name: '송파도서관',
    address: '서울특별시 송파구 동남로 263',
    neighborhood: '송파구',
    hours: '09:00 - 20:00',
    closedDays: '매월 둘째, 넷째 월요일',
    phone: '02-3434-3333',
    lat: 37.5026,
    lng: 127.1337,
  },
]

export function getBooksByGenre(genre: Genre): Book[] {
  return MOCK_BOOKS.filter((book) => book.genre === genre)
}

export function getBookById(id: string): Book | undefined {
  return MOCK_BOOKS.find((book) => book.id === id)
}

export function getReviewsByBookId(bookId: string): Review[] {
  return MOCK_REVIEWS.filter((review) => review.bookId === bookId)
}
