import { http, HttpResponse } from 'msw'
import { MOCK_BOOKS } from '../lib/mock' // Double check this path

export const handlers = [
  // This intercepts the POST call from your ResultPage
  http.post('/api/recommendations', async ({ request }) => {
    const info = await request.json() as { mood: string; taste: string; interest: string };

    console.log('Harness received data:', info);

    // The "우울" (Sad) Trigger
    if (info.mood && info.mood.includes('우울')) {
      // Return '아몬드' (ID: 4) and '미움받을 용기' (ID: 6)
      const sadBooks = MOCK_BOOKS.filter(b => b.id === '4' || b.id === '6');
      return HttpResponse.json(sadBooks);
    }

    // Default: Return '채식주의자' and '코스모스'
    return HttpResponse.json([MOCK_BOOKS[0], MOCK_BOOKS[1]]);
  }),
]