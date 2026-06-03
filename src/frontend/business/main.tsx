import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { BusinessInfoWidget } from './BusinessInfoWidget'
import { BusinessHoursWidget } from './BusinessHoursWidget'
import { BusinessMapWidget } from './BusinessMapWidget'

document.querySelectorAll<HTMLElement>('.werocket-business-info-mount').forEach(el => {
  createRoot(el).render(<BusinessInfoWidget />)
})

document.querySelectorAll<HTMLElement>('.werocket-business-hours-mount').forEach(el => {
  createRoot(el).render(<BusinessHoursWidget />)
})

document.querySelectorAll<HTMLElement>('.werocket-business-map-mount').forEach(el => {
  createRoot(el).render(<BusinessMapWidget />)
})
