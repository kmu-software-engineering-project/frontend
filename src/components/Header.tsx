'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/genres', label: 'Category' },
  { href: '/reviews', label: 'Search' },
  { href: '/libraries', label: 'Library' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#f5efe3]/88 backdrop-blur-xl">
      <div className="page-shell grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-950">
          Re:Ading
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-stone-900/10 bg-white/55 px-1.5 py-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-stone-950 text-white'
                    : 'text-stone-600 hover:bg-white hover:text-stone-950'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex justify-end">
          <Link
            href="/recommend"
            className="rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-primary-700"
          >
            도서 추천
          </Link>
        </div>
      </div>
    </header>
  )
}
