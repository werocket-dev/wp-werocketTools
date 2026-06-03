import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { CookiesBanner } from './CookiesBanner'

const el = document.getElementById('werocket-cookies-banner')
if (el) {
  const config = el.dataset.config ? JSON.parse(el.dataset.config) : {}
  createRoot(el).render(<CookiesBanner config={config} />)
}
