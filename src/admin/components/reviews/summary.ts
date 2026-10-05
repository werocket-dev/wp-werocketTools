import { TEMPLATE_META } from '@/frontend/reviews/templates'
import type { RatingBadgeViewProps } from '@/frontend/reviews/RatingBadge'
import type { ReviewsMeta, ReviewsSettings, ReviewTemplate } from '@/lib/types'

export type ReviewsSection = 'overview' | 'connection' | 'widget' | 'badge'

export const FORMAT_LABELS: Record<string, string> = { carousel: 'Carrousel', grid: 'Grille', list: 'Liste' }

/** Note fictive tant qu'aucune synchronisation n'a réussi. */
export const DEMO_META: ReviewsMeta = { rating: 4.8, total: 127 }

/** Avis visibles à la fois sur ordinateur, selon le format. */
export function visibleCount(s: Partial<ReviewsSettings>): number {
  return (s.display_style === 'carousel' ? s.carousel_slides?.desktop : s.grid_columns?.desktop) ?? 3
}

/** « Classic · Carrousel · 3 par vue » */
export function widgetSummary(s: Partial<ReviewsSettings>): string {
  const template = TEMPLATE_META[(s.template as ReviewTemplate) ?? 'classic']?.label ?? 'Classic'
  const format = s.display_style ?? 'grid'
  const parts = [template, FORMAT_LABELS[format] ?? format]
  if (format !== 'list') parts.push(`${visibleCount(s)} par vue`)
  return parts.join(' · ')
}

/** « Logo, note, étoiles et nombre d'avis » */
export function badgeSummary(s: Partial<ReviewsSettings>): string {
  const parts = [
    s.badge_show_logo !== false && 'logo',
    s.badge_show_rating !== false && 'note',
    s.badge_show_stars !== false && 'étoiles',
    s.badge_show_count !== false && 'nombre d\'avis',
  ].filter(Boolean) as string[]
  if (!parts.length) return 'Aucun élément affiché'
  const text = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function badgeProps(s: Partial<ReviewsSettings>, meta: ReviewsMeta | null): RatingBadgeViewProps {
  const { rating, total } = meta ?? DEMO_META
  return {
    rating,
    total,
    showLogo: s.badge_show_logo !== false,
    showRating: s.badge_show_rating !== false,
    showStars: s.badge_show_stars !== false,
    showCount: s.badge_show_count !== false,
    card: s.badge_card !== false,
    ratingColor: s.badge_rating_color ?? '',
    starColor: s.badge_star_color ?? '',
    countColor: s.badge_count_color ?? '',
  }
}
