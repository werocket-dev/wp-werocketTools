import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { ReviewsWidget } from './ReviewsWidget'

document.querySelectorAll<HTMLElement>('.werocket-reviews-mount').forEach(el => {
  const count = parseInt(el.dataset.count ?? '5', 10)
  const style = el.dataset.style ?? 'grid'
  createRoot(el).render(<ReviewsWidget count={count} displayStyle={style} />)
})
