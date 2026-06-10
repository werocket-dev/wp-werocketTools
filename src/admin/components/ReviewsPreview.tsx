import { useEffect, useState } from 'react'
import type { UseFormWatch } from 'react-hook-form'
import { IconInfoCircle } from '@tabler/icons-react'
import { TEMPLATES } from '@/frontend/reviews/templates'
import { ReviewsLayout } from '@/frontend/reviews/layout'
import { api } from '@/lib/api'
import type { Review, ReviewsSettings, ReviewTemplate, ResponsiveValue, CardShadow } from '@/lib/types'

const MOCK_REVIEWS: Review[] = [
  {
    author_name: 'Marie Dubois',
    profile_photo_url: 'https://i.pravatar.cc/64?img=47',
    rating: 5,
    text: 'Service exceptionnel, équipe à l\'écoute et très professionnelle. Le résultat dépasse mes attentes, je recommande vivement !',
    relative_time_description: 'il y a 2 semaines',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Thomas Laurent',
    profile_photo_url: 'https://i.pravatar.cc/64?img=12',
    rating: 5,
    text: 'Travail impeccable, livré dans les temps. Communication fluide du début à la fin. Je referai appel à eux sans hésiter.',
    relative_time_description: 'il y a 1 mois',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Sophie Martin',
    profile_photo_url: 'https://i.pravatar.cc/64?img=32',
    rating: 4,
    text: 'Très bonne expérience globale. Quelques petits ajustements ont été nécessaires mais l\'équipe a été très réactive.',
    relative_time_description: 'il y a 3 mois',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Antoine Garcia',
    rating: 5,
    text: 'Une prestation de qualité, avec un excellent rapport qualité/prix. Je suis ravi du résultat final.',
    relative_time_description: 'il y a 5 mois',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Camille Roux',
    profile_photo_url: 'https://i.pravatar.cc/64?img=20',
    rating: 5,
    text: 'Bravo pour le sérieux et le professionnalisme. Tout a été parfait, du premier contact à la livraison.',
    relative_time_description: 'il y a 6 mois',
    time: Date.now() / 1000,
  },
]

const DEFAULT_RV3: ResponsiveValue<number> = { desktop: 3, tablet: 2, mobile: 1 }
const DEFAULT_GAP: ResponsiveValue<number> = { desktop: 16, tablet: 12, mobile: 8 }
const DEFAULT_PADDING: ResponsiveValue<number> = { desktop: 24, tablet: 20, mobile: 16 }

interface Props {
  watch: UseFormWatch<ReviewsSettings>
  /** Incrémenté après une synchro réussie pour recharger les vrais avis */
  refreshKey?: number
}

export function ReviewsPreview({ watch, refreshKey = 0 }: Props) {
  const [realReviews, setRealReviews] = useState<Review[]>([])

  useEffect(() => {
    api.get<{ reviews: Review[] }>('/reviews')
      .then(data => setRealReviews(Array.isArray(data.reviews) ? data.reviews : []))
      .catch(() => setRealReviews([]))
  }, [refreshKey])

  const template = (watch('template') as ReviewTemplate) || 'classic'
  const displayStyle = watch('display_style') || 'grid'
  const minRating = Number(watch('min_rating') ?? 4)
  const count = Math.max(1, Math.min(20, Number(watch('reviews_count') ?? 3)))

  const settings: Partial<ReviewsSettings> = {
    template,
    display_style: displayStyle,
    show_rating: watch('show_rating'),
    show_date: watch('show_date'),
    show_avatar: watch('show_avatar'),
    min_rating: minRating,
    reviews_count: count,

    grid_columns:    (watch('grid_columns')    as ResponsiveValue<number>) ?? DEFAULT_RV3,
    grid_gap:        (watch('grid_gap')        as ResponsiveValue<number>) ?? DEFAULT_GAP,
    card_padding:    (watch('card_padding')    as ResponsiveValue<number>) ?? DEFAULT_PADDING,
    carousel_slides: (watch('carousel_slides') as ResponsiveValue<number>) ?? DEFAULT_RV3,

    card_radius: Number(watch('card_radius') ?? 12),
    card_shadow: (watch('card_shadow') as CardShadow) ?? 'subtle',

    card_bg_color: watch('card_bg_color') ?? '',
    text_color: watch('text_color') ?? '',
    star_color: watch('star_color') ?? '',
    avatar_size: Number(watch('avatar_size') ?? 40),
    show_google_badge: watch('show_google_badge') !== false,

    carousel_autoplay: !!watch('carousel_autoplay'),
    carousel_autoplay_speed: Number(watch('carousel_autoplay_speed') ?? 5),
    carousel_loop: watch('carousel_loop') !== false,
    carousel_show_arrows: watch('carousel_show_arrows') !== false,
    carousel_show_dots: watch('carousel_show_dots') !== false,
  }

  const usingRealData = realReviews.length > 0
  const source = usingRealData ? realReviews : MOCK_REVIEWS

  const reviews = source
    .filter(r => r.rating >= minRating)
    .slice(0, count)

  if (!reviews.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Aucun avis ne correspond à la note minimale ({minRating}★).
      </p>
    )
  }

  const Template = TEMPLATES[template] ?? TEMPLATES.classic

  return (
    <div className="space-y-3">
      {!usingRealData && (
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <IconInfoCircle size={13} />
          Avis fictifs — synchronisez votre Place ID pour afficher vos vrais avis Google.
        </p>
      )}
      <ReviewsLayout settings={settings}>
        {reviews.map((review, i) => (
          <Template key={i} review={review} settings={settings} />
        ))}
      </ReviewsLayout>
    </div>
  )
}
