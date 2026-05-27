import { NextResponse } from 'next/server';
import { MOCK_BOOKS } from '@/lib/mock';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // New params: bookType, genre, interest, purpose, atmosphere, difficulty, pastBooks, avoidElements
    // Legacy params: taste, interest, mood (kept for backwards compat)
    const { genre, interest, purpose, bookType, atmosphere, difficulty } = body;

    // Placeholder logic — replace with real AI recommendation when backend is ready
    if (genre?.includes('추리') || genre?.includes('스릴러') || genre?.includes('공포')) {
      return NextResponse.json([MOCK_BOOKS[2], MOCK_BOOKS[0]]);
    }
    if (interest?.includes('심리') || interest?.includes('자존감') || purpose?.includes('위로')) {
      return NextResponse.json([MOCK_BOOKS[5], MOCK_BOOKS[3]]);
    }
    if (bookType === '비문학' || genre?.includes('경제') || genre?.includes('자기계발')) {
      return NextResponse.json([MOCK_BOOKS[6], MOCK_BOOKS[4]]);
    }
    if (genre?.includes('SF') || interest?.includes('과학/기술')) {
      return NextResponse.json([MOCK_BOOKS[1], MOCK_BOOKS[4]]);
    }

    // Default: return first two books
    return NextResponse.json([MOCK_BOOKS[0], MOCK_BOOKS[1]]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}