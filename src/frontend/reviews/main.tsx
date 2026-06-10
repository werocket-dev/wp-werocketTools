import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { ReviewsWidget } from './ReviewsWidget'
import { RatingBadge } from './RatingBadge'
import type { ReviewTemplate } from '@/lib/types'

const VALID_TEMPLATES: ReviewTemplate[] = ['minimal', 'classic', 'card', 'quote', 'google']

document.querySelectorAll<HTMLElement>('.werocket-reviews-mount').forEach(el => {
  const count = parseInt(el.dataset.count ?? '5', 10)
  const style = el.dataset.style ?? 'grid'
  const rawTemplate = el.dataset.template
  const template = rawTemplate && VALID_TEMPLATES.includes(rawTemplate as ReviewTemplate)
    ? (rawTemplate as ReviewTemplate)
    : undefined
  createRoot(el).render(<ReviewsWidget count={count} displayStyle={style} templateOverride={template} />)
})

document.querySelectorAll<HTMLElement>('.werocket-badge-mount').forEach(el => {
  createRoot(el).render(
    <RatingBadge
      logo={el.dataset.logo ?? ''}
      note={el.dataset.note ?? ''}
      etoiles={el.dataset.etoiles ?? ''}
      avis={el.dataset.avis ?? ''}
      carte={el.dataset.carte ?? ''}
    />
  )
})
