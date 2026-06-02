import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

/* ── Korean → backend enum mappings ── */

const BOOK_TYPE_MAP: Record<string, string> = {
  '소설': 'FICTION',
  '에세이': 'FICTION',
  '시/문학': 'FICTION',
  '비문학': 'NONFICTION',
};

const FICTION_GENRE_MAP: Record<string, string> = {
  '로맨스': 'romance',
  '판타지': 'fantasy',
  'SF': 'sf',
  '추리/미스터리': 'mystery',
  '스릴러': 'thriller',
  '공포': 'horror',
  '역사소설': 'historical',
  '성장소설': 'coming_of_age',
  '가족소설': 'family',
  '휴먼드라마': 'human_drama',
  '고전문학': 'classic',
  '현대문학': 'contemporary',
};

const NONFICTION_GENRE_MAP: Record<string, string> = {
  '인문/철학': 'humanities',
  '심리': 'psychology',
  '자기계발': 'self_help',
  '경제/경영': 'economics',
  '사회/정치': 'social_political',
  '역사': 'history',
  '과학': 'science',
  '기술/IT': 'tech_it',
  '예술/문화': 'arts_culture',
  '여행': 'travel',
  '건강': 'health',
  '교육': 'education',
  '종교': 'religion',
};

const INTEREST_MAP: Record<string, string> = {
  '인간관계': 'relationships',
  '사랑': 'love',
  '성장': 'growth',
  '위로/힐링': 'comfort',
  '자존감': 'self_esteem',
  '심리': 'psychology',
  '삶의 의미': 'meaning_of_life',
  '돈/투자': 'money_investment',
  '일/커리어': 'career',
  '사회문제': 'social_issues',
  '역사': 'history',
  '과학/기술': 'science_tech',
  '예술/창작': 'arts_creation',
  '여행': 'travel',
  '미스터리': 'mystery',
  '새로운 세계관': 'new_world',
};

const PURPOSE_MAP: Record<string, string> = {
  '몰입': 'immersion',
  '기분 전환': 'mood_change',
  '위로': 'comfort',
  '지식 습득': 'knowledge',
  '생각거리': 'contemplation',
  '가벼운 독서': 'light_read',
  '깊이 있는 독서': 'deep_read',
  '과제·독후감': 'assignment',
  '새로운 취향 발견': 'new_taste',
};

const MOOD_MAP: Record<string, string> = {
  '따뜻한': 'warm',
  '어두운': 'dark',
  '감성적인': 'emotional',
  '유쾌한': 'cheerful',
  '잔잔한': 'calm',
  '철학적인': 'philosophical',
  '긴장감 있는': 'tense',
  '현실적인': 'realistic',
  '몽환적인': 'dreamy',
  '희망적인': 'hopeful',
  '슬픈': 'sad',
};

const DIFFICULTY_MAP: Record<string, string> = {
  '아주 쉽게 읽히는 책': 'very_easy',
  '적당히 생각하면서 읽는 책': 'moderate',
  '문장이 좋은 책': 'literary',
  '전문적인 책': 'professional',
  '깊이 있는 책': 'deep',
  '짧고 가벼운 책': 'short_light',
  '긴 분량도 괜찮은 책': 'long_ok',
};

function mapList(items: string[], map: Record<string, string>): string[] {
  return items.map(item => map[item]).filter(Boolean);
}

function splitCSV(value: string): string[] {
  return value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookType, genre, interest, purpose, atmosphere, difficulty, pastBooks, avoidElements } = body;

    const bookTypeCode = BOOK_TYPE_MAP[bookType] ?? 'FICTION';
    const genreMap = bookTypeCode === 'NONFICTION' ? NONFICTION_GENRE_MAP : FICTION_GENRE_MAP;

    const genreList   = mapList(splitCSV(genre), genreMap);
    const interestList = mapList(splitCSV(interest), INTEREST_MAP);
    const purposeList  = mapList(splitCSV(purpose), PURPOSE_MAP);
    const moodList     = bookTypeCode === 'FICTION' ? mapList(splitCSV(atmosphere), MOOD_MAP) : [];
    const difficultyList = mapList(splitCSV(difficulty), DIFFICULTY_MAP);

    const payload = {
      book_type:      bookTypeCode,
      genres:         genreList.length > 0 ? genreList : [bookTypeCode === 'NONFICTION' ? 'humanities' : 'contemporary'],
      interests:      interestList,
      purpose:        purposeList,
      mood:           moodList,
      difficulty:     difficultyList,
      favorite_books: pastBooks ?? '',
      avoid_elements: avoidElements ?? '',
    };

    const res = await fetch(`${BACKEND_URL}/api/v1/recommendations/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Backend error:', err);
      return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    }

    const data = await res.json();
    const recommendations = (data.recommendations ?? []).map(
      (book: { title: string; author: string; reason?: string; isbn?: string }, i: number) => ({
        id:     book.isbn ?? `rec-${i}`,
        title:  book.title,
        author: book.author,
        reason: book.reason,
      })
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Recommend API error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
