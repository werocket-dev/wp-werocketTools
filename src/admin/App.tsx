import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Header } from './components/Header'
import { TabsNav } from './components/TabsNav'
import { GlobalSaveButton } from './components/GlobalSaveButton'
import { PageHeader } from './components/PageHeader'
import { StatusBadge } from './components/StatusBadge'
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
import { ModuleIcon } from '@/lib/module-icons'
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

  /** `section` : sous-onglet à ouvrir sur la page du module (lu au montage via ?section=). */
  function navigate(newTab: string, section?: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newTab)
    if (section) url.searchParams.set('section', section)
    else url.searchParams.delete('section')
    window.history.pushState({}, '', url)
    setTab(newTab)
  }

  function handleToggle(id: string, active: boolean) {
    setModules(prev => prev.map(m => m.id === id ? { ...m, active } : m))
  }

  const pageProps = { modules, onToggle: handleToggle }
  const currentModule = modules.find(m => m.id === tab)

  return (
    <SaveProvider>
      <div id="werocket-app" className="werocket-wrap min-h-[calc(100vh-32px)] bg-background">
        <Header>
          {!loading && <TabsNav modules={modules} currentTab={tab} onNavigate={navigate} />}
        </Header>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <IconLoader2 size={20} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="px-4 sm:px-8">
                <LoadErrorCard message={loadError} />
              </div>
            )}
            <ErrorBoundary resetKey={tab}>
              {tab === 'dashboard' ? (
                <Dashboard {...pageProps} onNavigate={navigate} />
              ) : (
                <>
                  {currentModule && (
                    <PageHeader
                      icon={<ModuleIcon id={currentModule.id} className="size-[22px]" />}
                      title={currentModule.name}
                      badge={currentModule.active
                        ? <StatusBadge>Actif</StatusBadge>
                        : <StatusBadge tone="neutral">Inactif</StatusBadge>}
                      description={currentModule.description}
                      actions={<GlobalSaveButton />}
                    />
                  )}
                  <div className="px-4 pt-7 pb-12 sm:px-8">
                    {tab === 'cookies' && <CookiesSettings />}
                    {tab === 'google_reviews' && <ReviewsSettings />}
                    {tab === 'retractation' && <RetractationSettings />}
                    {tab === 'click_collect' && <ClickCollectSettings />}
                    {tab === 'company_info' && <CompanyInfoSettings />}
                  </div>
                </>
              )}
            </ErrorBoundary>
          </>
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
