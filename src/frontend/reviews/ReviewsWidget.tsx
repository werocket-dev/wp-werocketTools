import { useEffect, useState } from 'react'
import { IconStarFilled, IconStar } from '@tabler/icons-react'
import type { Review, ReviewsSettings } from '@/lib/types'

function getRestUrl(): string {
  return (window as unknown as Record<string, Record<string, string>>)['werocketFrontend']?.restUrl
    ?? '/wp-json/werocket/v1/'
}

interface Props {
  count: number
  displayStyle: string
}

export function ReviewsWidget({ count, displayStyle }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [settings, setSettings] = useState<Partial<ReviewsSettings>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getRestUrl()}reviews`)
      .then(r => r.json())
      .then(data => {
        const s: ReviewsSettings = data.settings ?? {}
        const all: Review[] = data.reviews ?? []
        const minRating = s.min_rating ?? 4
        setSettings(s)
        setReviews(all.filter(r => r.rating >= minRating).slice(0, count))
      })
      .finally(() => setLoading(false))
  }, [count])

  if (loading) return <p className="text-muted-foreground text-sm">Chargement des avis...</p>
  if (!reviews.length) return <p className="text-muted-foreground text-sm">Aucun avis disponible.</p>

  const gridClass = displayStyle === 'list'
    ? 'flex flex-col gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  return (
    <div className={gridClass}>
      {reviews.map((review, i) => (
        <ReviewCard key={i} review={review} settings={settings} />
      ))}
    </div>
  )
}

function ReviewCard({ review, settings }: { review: Review; settings: Partial<ReviewsSettings> }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {settings.show_avatar !== false && review.profile_photo_url && (
        <div className="flex items-center gap-3">
          <img src={review.profile_photo_url} alt={review.author_name} className="w-9 h-9 rounded-full object-cover" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.author_name}</p>
            {settings.show_date !== false && (
              <p className="text-xs text-gray-500">{review.relative_time_description}</p>
            )}
          </div>
        </div>
      )}
      {settings.show_rating !== false && (
        <Stars rating={review.rating} />
      )}
      <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
        n <= rating
          ? <IconStarFilled key={n} size={16} className="text-amber-400" />
          : <IconStar key={n} size={16} className="text-gray-300" />
      ))}
    </div>
  )
}
