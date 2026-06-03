import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { App } from './App'

const root = document.getElementById('werocket-admin-root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
