import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Header } from './components/Header'
import { TabsNav } from './components/TabsNav'
import { Dashboard } from './pages/Dashboard'
import { CookiesSettings } from './pages/CookiesSettings'
import { ReviewsSettings } from './pages/ReviewsSettings'
import { BusinessSettings } from './pages/BusinessSettings'
import { api } from '@/lib/api'
import type { Module } from '@/lib/types'
import { IconLoader2 } from '@tabler/icons-react'

function getTab(): string {
  return new URLSearchParams(window.location.search).get('tab') ?? 'dashboard'
}

export function App() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(getTab)

  useEffect(() => {
    api.get<{ modules: Module[] }>('/modules')
      .then(data => setModules(data.modules))
      .finally(() => setLoading(false))
  }, [])

  function navigate(newTab: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newTab)
    window.history.pushState({}, '', url)
    setTab(newTab)
  }

  function handleToggle(id: string, active: boolean) {
    setModules(prev => prev.map(m => m.id === id ? { ...m, active } : m))
  }

  const pageProps = { modules, onToggle: handleToggle }

  return (
    <div id="werocket-app" className="werocket-wrap">
      <Header />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 mr-4">
          <IconLoader2 size={20} className="animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : (
        <>
          <TabsNav modules={modules} currentTab={tab} onNavigate={navigate} />
          <div className="mt-4 mr-4">
            {tab === 'dashboard' && <Dashboard {...pageProps} onNavigate={navigate} />}
            {tab === 'cookies' && <CookiesSettings />}
            {tab === 'google_reviews' && <ReviewsSettings />}
            {tab === 'google_business' && <BusinessSettings />}
          </div>
        </>
      )}

      <Toaster richColors position="bottom-right" />
    </div>
  )
}
