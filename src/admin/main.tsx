import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

const root = document.getElementById('werocket-admin-root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary standalone>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
}
