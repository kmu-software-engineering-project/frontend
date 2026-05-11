import Link from 'next/link'
import Image from 'next/image'
import { Book } from '@/types'

interface BookCardProps {
  book: Book
  reason?: string
  variant?: 'default' | 'compact' | 'featured'
}

export default function BookCard({ book, reason, variant = 'default' }: BookCardProps) {
  const { id, title, author, genre, rating, thumbnailUrl } = book

  if (variant === 'compact') {
    return (
      <Link
        href={`/books/${id}`}
        className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="w-12 h-16 bg-gray-200 rounded shrink-0 overflow-hidden relative">
          {thumbnailUrl && (
            <Image src={thumbnailUrl} alt={title} fill className="object-cover" sizes="48px" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate group-hover:text-primary-600">
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{author}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/books/${id}`} className="group block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
              📖
            </div>
          )}
          <span className="absolute top-2 right-2 bg-white/90 text-xs font-medium text-primary-700 px-2 py-0.5 rounded-full">
            {genre}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{author}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
          </div>
          {reason && (
            <p className="mt-3 text-xs text-primary-700 bg-primary-50 rounded-lg p-2 leading-relaxed">
              💡 {reason}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
