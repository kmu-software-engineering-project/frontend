'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BookCard from '@/components/BookCard';
import { Book } from '@/types';

// We wrap the content in a separate component to handle Next.js searchParams requirements
function ResultContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mood = searchParams.get('mood') || '';

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taste: searchParams.get('taste'),
            interest: searchParams.get('interest'),
            mood: mood
          })
        });
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Failed to load recommendations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams, mood]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="animate-pulse text-5xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">당신에게 꼭 맞는 책을 분석 중입니다...</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">✨ 추천 결과</h1>
        <p className="text-gray-500">당신의 현재 상태와 취향을 분석한 결과입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            reason={mood.includes('우울') 
              ? "우울한 마음을 환기시켜줄 수 있는 심층적인 도서입니다." 
              : "선택하신 관심사와 취향에 가장 가까운 도서입니다."}
          />
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/recommend"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          ← 다시 추천받기
        </Link>
      </div>
    </div>
  );
}

// Next.js requires Suspense when using useSearchParams in a client component
export default function RecommendResultPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}