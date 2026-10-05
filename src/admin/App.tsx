import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Header } from './components/Header'
import { TabsNav } from './components/TabsNav'
import { GlobalSaveButton } from './components/GlobalSaveButton'
import { SaveProvider } from './context/SaveContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Dashboard } from './pages/Dashboard'
import { CookiesSettings } from './pages/CookiesSettings'
import { ReviewsSettings } from './pages/ReviewsSettings'
import { RetractationSettings } from './pages/RetractationSettings'
import { ClickCollectSettings } from './pages/ClickCollectSettings'
import { CompanyInfoSettings } from './pages/CompanyInfoSettings'
import { api } from '@/lib/api'
import type { Module } from '@/lib/types'
import { IconAlertTriangle, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function getTab(): string {
  return new URLSearchParams(window.location.search).get('tab') ?? 'dashboard'
}

export function App() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState(getTab)

  useEffect(() => {
    api.get<{ modules?: unknown }>('/modules')
      .then(data => {
        // Un plugin tiers peut altérer la réponse REST : sans ce garde-fou,
        // `modules` non-tableau faisait planter tout le rendu (page blanche).
        if (!Array.isArray(data?.modules)) {
          throw new Error('Réponse inattendue de /werocket/v1/modules')
        }
        setModules(data.modules as Module[])
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : String(e))
      })
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
    <SaveProvider>
      <div id="werocket-app" className="werocket-wrap">
        <Header>
          {!loading && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TabsNav modules={modules} currentTab={tab} onNavigate={navigate} />
              <GlobalSaveButton />
            </div>
          )}
        </Header>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 mr-4">
            <IconLoader2 size={20} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <div className="mr-4">
            {loadError && <LoadErrorCard message={loadError} />}
            <ErrorBoundary resetKey={tab}>
              {tab === 'dashboard' && <Dashboard {...pageProps} onNavigate={navigate} />}
              {tab === 'cookies' && <CookiesSettings />}
              {tab === 'google_reviews' && <ReviewsSettings />}
              {tab === 'retractation' && <RetractationSettings />}
              {tab === 'click_collect' && <ClickCollectSettings />}
              {tab === 'company_info' && <CompanyInfoSettings />}
            </ErrorBoundary>
          </div>
        )}

        <Toaster richColors position="bottom-right" />
      </div>
    </SaveProvider>
  )
}

function LoadErrorCard({ message }: { message: string }) {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconAlertTriangle size={20} className="text-destructive" />
          Impossible de charger la liste des modules
        </CardTitle>
        <CardDescription>
          {message} — vérifiez que l'API REST de WordPress n'est pas bloquée
          (plugin de sécurité, pare-feu de l'hébergeur).
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Recharger la page
        </Button>
      </CardFooter>
    </Card>
  )
}
