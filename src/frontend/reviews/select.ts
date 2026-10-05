import type { Review, ReviewsSettings } from '@/lib/types'

/**
 * Avis à afficher : filtrés par note minimale, triés selon l'ordre choisi,
 * puis limités au nombre demandé. Partagé par le widget public et l'aperçu
 * de l'admin, pour qu'ils affichent toujours la même chose.
 */
export function selectReviews(all: Review[], settings: Partial<ReviewsSettings>, count: number): Review[] {
  const minRating = settings.min_rating ?? 4
  const kept = all.filter(r => r.rating >= minRating)
  if (settings.reviews_order === 'best') {
    kept.sort((a, b) => b.rating - a.rating || b.time - a.time)
  } else {
    kept.sort((a, b) => b.time - a.time)
  }
  return kept.slice(0, count)
}
