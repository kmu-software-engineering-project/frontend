'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RecommendPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ taste: '', interest: '', mood: '' });

  // Simple validation check
  const isFormValid = 
    formData.taste.trim() !== '' && 
    formData.interest.trim() !== '' && 
    formData.mood.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Convert form data into URL parameters (e.g., ?mood=우울&taste=고전)
    const params = new URLSearchParams(formData).toString();
    
    // Send the user to the dedicated result page
    router.push(`/recommend/result?${params}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">맞춤 도서 추천</h1>
        <p className="text-gray-500 mt-2">당신의 현재 상태에 맞는 최적의 책을 찾아드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">취향</label>
            <input 
              className="p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-black"
              placeholder="예: 미스터리, 고전" 
              value={formData.taste}
              onChange={e => setFormData({...formData, taste: e.target.value})} 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">관심사</label>
            <input 
              className="p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-black"
              placeholder="예: 과학, 요리" 
              value={formData.interest}
              onChange={e => setFormData({...formData, interest: e.target.value})} 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">오늘의 기분</label>
            <input 
              className="p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-black"
              placeholder="예: 우울함, 설렘" 
              value={formData.mood}
              onChange={e => setFormData({...formData, mood: e.target.value})} 
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={!isFormValid}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            isFormValid ? 'bg-black hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          도서 추천 받기
        </button>
      </form>
    </div>
  );
}