import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { ReviewsWidget } from './ReviewsWidget'
import { RatingBadge } from './RatingBadge'
import type { ReviewTemplate } from '@/lib/types'

const VALID_TEMPLATES: ReviewTemplate[] = ['minimal', 'classic', 'card', 'quote', 'google']

function mountReviews(el: HTMLElement) {
  const count = parseInt(el.dataset.count ?? '5', 10)
  const style = el.dataset.style ?? 'grid'
  const rawTemplate = el.dataset.template
  const template = rawTemplate && VALID_TEMPLATES.includes(rawTemplate as ReviewTemplate)
    ? (rawTemplate as ReviewTemplate)
    : undefined
  createRoot(el).render(<ReviewsWidget count={count} displayStyle={style} templateOverride={template} />)
}

function mountBadge(el: HTMLElement) {
  createRoot(el).render(
    <RatingBadge
      logo={el.dataset.logo ?? ''}
      note={el.dataset.note ?? ''}
      etoiles={el.dataset.etoiles ?? ''}
      avis={el.dataset.avis ?? ''}
      carte={el.dataset.carte ?? ''}
    />
  )
}

const SELECTOR = '.werocket-reviews-mount, .werocket-badge-mount'

/**
 * Monte tous les widgets non encore montés. Idempotent : le marqueur
 * data-wr-mounted évite un double createRoot sur le même nœud.
 */
function scanAndMount() {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach(el => {
    if (el.dataset.wrMounted) return
    el.dataset.wrMounted = '1'
    if (el.classList.contains('werocket-reviews-mount')) {
      mountReviews(el)
    } else {
      mountBadge(el)
    }
  })
}

scanAndMount()

/*
 * Les builders (Breakdance, Elementor…) et les contenus AJAX injectent les
 * shortcodes APRÈS l'exécution de ce script : sans observer, les divs de
 * montage arrivent dans le DOM trop tard et restent vides. On surveille
 * donc le DOM et on monte tout widget ajouté dynamiquement.
 */
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue
      if (node.matches?.(SELECTOR) || node.querySelector?.(SELECTOR)) {
        scanAndMount()
        return
      }
    }
  }
})
observer.observe(document.documentElement, { childList: true, subtree: true })
