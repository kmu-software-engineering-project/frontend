import { NextResponse } from 'next/server';
import { MOCK_BOOKS } from '@/lib/mock';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mood } = body;

    // The "우울" Trigger logic
    if (mood && mood.includes('우울')) {
      // Return '아몬드' (ID: 4) and '미움받을 용기' (ID: 6)
      const filtered = MOCK_BOOKS.filter(b => b.id === '4' || b.id === '6');
      return NextResponse.json(filtered);
    }

    // Default: Return the first two books
    return NextResponse.json([MOCK_BOOKS[0], MOCK_BOOKS[1]]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}