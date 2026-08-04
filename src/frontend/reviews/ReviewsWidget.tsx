import { useEffect, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { TEMPLATES } from './templates'
import { ReviewsLayout } from './layout'
import type { Review, ReviewsSettings, ReviewTemplate } from '@/lib/types'
import { fetchReviews } from './reviews-api'

interface Props {
  count: number
  displayStyle: string
  templateOverride?: ReviewTemplate
}

export function ReviewsWidget({ count, displayStyle, templateOverride }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [settings, setSettings] = useState<Partial<ReviewsSettings>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
      .then(({ reviews: all, settings: s }) => {
        const minRating = s.min_rating ?? 4
        setSettings(s)
        setReviews(all.filter(r => r.rating >= minRating).slice(0, count))
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [count])

  useEffect(() => {
    if (settings.custom_css) {
      const id = 'werocket-reviews-custom-css'
      if (!document.getElementById(id)) {
        const style = document.createElement('style')
        style.id = id
        style.textContent = settings.custom_css
        document.head.appendChild(style)
      }
    }
  }, [settings.custom_css])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
        <IconLoader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement des avis...</span>
      </div>
    )
  }

  if (!reviews.length) {
    return <p className="text-muted-foreground text-sm text-center py-8">Aucun avis disponible.</p>
  }

  const templateKey: ReviewTemplate = templateOverride
    ?? (settings.template as ReviewTemplate)
    ?? 'classic'
  const Template = TEMPLATES[templateKey] ?? TEMPLATES.classic

  return (
    <ReviewsLayout settings={{ ...settings, display_style: displayStyle }}>
      {reviews.map((review, i) => (
        <Template key={i} review={review} settings={settings} />
      ))}
    </ReviewsLayout>
  )
}
