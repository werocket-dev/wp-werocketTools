import type { Review, ReviewsMeta, ReviewsSettings } from '@/lib/types'

/** Forme de la réponse de GET werocket/v1/reviews (cf. Admin\RestApi::get_reviews). */
export interface ReviewsPayload {
  reviews: Review[]
  settings: Partial<ReviewsSettings>
  meta: ReviewsMeta | null
}

function getRestUrl(): string {
  return (window as unknown as Record<string, Record<string, string>>)['werocketFrontend']?.restUrl
    ?? '/wp-json/werocket/v1/'
}

let pending: Promise<ReviewsPayload> | null = null

/**
 * Charge le payload des avis, une seule fois par page.
 *
 * Une page peut porter plusieurs widgets (un badge en footer + un ou plusieurs
 * blocs d'avis), chacun monté dans sa propre racine React : sans cette
 * mémoïsation, chaque widget déclenchait sa propre requête identique.
 */
export function fetchReviews(): Promise<ReviewsPayload> {
  if (!pending) {
    pending = fetch(`${getRestUrl()}reviews`)
      .then(r => r.json())
      .then((data: Partial<ReviewsPayload>) => ({
        reviews: data.reviews ?? [],
        settings: data.settings ?? {},
        meta: data.meta ?? null,
      }))
      .catch(err => {
        // Ne pas mémoriser un échec : un widget monté plus tard (contenu
        // injecté par le builder, AJAX) doit pouvoir retenter.
        pending = null
        throw err
      })
  }
  return pending
}
