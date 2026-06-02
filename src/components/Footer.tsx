import Link from 'next/link'

export default function Footer() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.CONTACT_EMAIL

  return (
    <footer className="mt-auto border-t border-stone-900/10 bg-stone-950 text-stone-300">
      <div className="page-shell py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-lg font-semibold text-white">Re:Ading</p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-stone-400">
              실제 도서 데이터와 독자 리뷰를 연결해 다음에 읽을 책을 더 쉽게 고를 수 있도록 돕는 독서 추천 서비스입니다.
            </p>
            {contactEmail ? (
              <p className="mt-3 text-sm text-stone-400">
                문의: <a href={`mailto:${contactEmail}`} className="hover:text-white">{contactEmail}</a>
              </p>
            ) : (
              <p className="mt-3 text-sm text-stone-400">문의 메일: 환경 변수 NEXT_PUBLIC_CONTACT_EMAIL 설정 필요</p>
            )}
          </div>

          <div>
            <p className="mb-3 font-medium text-white">바로가기</p>
            <ul className="grid gap-2 text-sm sm:grid-cols-2 md:grid-cols-1">
              <li>
                <Link href="/genres" className="hover:text-white">
                  장르별 소개
                </Link>
              </li>
              <li>
                <Link href="/libraries" className="hover:text-white">
                  도서관 맵
                </Link>
              </li>
              <li>
                <Link href="/recommend" className="hover:text-white">
                  맞춤 추천
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white">
                  독자 리뷰
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-stone-500">
          © 2026 Re:Ading. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
