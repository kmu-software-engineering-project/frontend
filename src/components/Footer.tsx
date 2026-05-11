export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-white font-bold text-lg mb-1">📚 BookAI</p>
            <p className="text-sm">AI가 당신에게 딱 맞는 책을 추천해 드립니다.</p>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-white font-medium mb-2">서비스</p>
              <ul className="space-y-1">
                <li>
                  <a href="/genres" className="hover:text-white transition-colors">
                    장르별 도서
                  </a>
                </li>
                <li>
                  <a href="/reviews" className="hover:text-white transition-colors">
                    도서 리뷰
                  </a>
                </li>
                <li>
                  <a href="/recommend" className="hover:text-white transition-colors">
                    AI 추천
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-white font-medium mb-2">정보</p>
              <ul className="space-y-1">
                <li>
                  <a href="/libraries" className="hover:text-white transition-colors">
                    도서관 찾기
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-xs text-center">
          © 2026 BookAI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
