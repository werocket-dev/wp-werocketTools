import { createRoot } from 'react-dom/client'
import '@/styles/frontend.css'
import { CookiesRoot } from './CookiesRoot'
import type { CookiesSettings } from '@/lib/types'

const el = document.getElementById('werocket-cookies-banner')
if (el) {
  const config: CookiesSettings = el.dataset.config ? JSON.parse(el.dataset.config) : null
  if (config) createRoot(el).render(<CookiesRoot config={config} />)
}
