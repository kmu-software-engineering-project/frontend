import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'

interface BookCardProps {
  book: Book
  reason?: string
  variant?: 'default' | 'compact' | 'featured'
}

function Rating({ rating, compact = false }: { rating: number; compact?: boolean }) {
  return (
    <div className="flex items-center gap-1 text-primary-700">
      <span className={compact ? 'text-xs' : 'text-sm'}>★</span>
      <span className={compact ? 'text-xs text-stone-600' : 'text-sm font-medium text-stone-700'}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

export default function BookCard({ book, reason, variant = 'default' }: BookCardProps) {
  const { id, title, author, genre, rating, thumbnailUrl } = book

  if (variant === 'compact') {
    return (
      <Link href={`/books/${id}`} className="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-white/70">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-primary-100">
          {thumbnailUrl && <Image src={thumbnailUrl} alt={title} fill className="object-cover" sizes="48px" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950 group-hover:text-primary-700">{title}</p>
          <p className="mt-0.5 text-xs text-stone-500">{author}</p>
          <div className="mt-1">
            <Rating rating={rating} compact />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/books/${id}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-stone-900/10 bg-white/75 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-soft">
        <div className="relative h-52 overflow-hidden bg-primary-100">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">No cover</div>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm">
            {genre}
          </span>
        </div>
        <div className="p-4">
          <h3 className="truncate font-semibold text-stone-950 transition-colors group-hover:text-primary-700">
            {title}
          </h3>
          <p className="mt-1 text-sm text-stone-500">{author}</p>
          <div className="mt-3">
            <Rating rating={rating} />
          </div>
          {reason && (
            <p className="mt-3 rounded-md bg-primary-50 p-3 text-xs leading-relaxed text-primary-800">
              {reason}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
