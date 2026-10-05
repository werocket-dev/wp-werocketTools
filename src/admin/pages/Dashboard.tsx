import { useCallback, useEffect, useState } from 'react'
import { BookOpen, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LINKS, MODULE_GROUPS, getModuleCategory, type ModuleCategory } from '@/lib/modules'
import type { DashboardStatus, Module } from '@/lib/types'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { TodoCard } from '../components/dashboard/TodoCard'
import { ModuleGroupCard } from '../components/dashboard/ModuleGroupCard'
import { HelpCard, PluginInfoCard, ShopCard } from '../components/dashboard/AsideCards'
import { PANEL, SECONDARY_BUTTON } from '../components/styles'

type FilterCategory = 'all' | ModuleCategory

interface Props {
  modules: Module[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string, section?: string) => void
}

export function Dashboard({ modules, onToggle, onNavigate }: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [status, setStatus] = useState<DashboardStatus | null>(null)
  const { version } = document.getElementById('werocket-admin-root')!.dataset as { version: string }

  const loadStatus = useCallback(() => {
    api.get<DashboardStatus>('/dashboard')
      .then(setStatus)
      // Non bloquant : sans état serveur, le bloc « À traiter » est masqué
      // et l'aside affiche des tirets ; la gestion des modules reste utilisable.
      .catch(e => console.error('[WeRocketTools] /dashboard', e))
  }, [])

  useEffect(loadStatus, [loadStatus])

  // Activer/désactiver un module change les alertes et le compteur d'actifs.
  function handleToggle(id: string, active: boolean) {
    onToggle(id, active)
    loadStatus()
  }

  const byGroup = MODULE_GROUPS.map(group => ({
    group,
    modules: modules.filter(m => getModuleCategory(m.id) === group.id),
  })).filter(section => section.modules.length > 0)

  const filters: { value: FilterCategory; label: string }[] = [
    { value: 'all', label: `Tous · ${modules.length}` },
    ...byGroup.map(({ group, modules: m }) => ({ value: group.id, label: `${group.label} · ${m.length}` })),
  ]

  const sections = byGroup.filter(s => filter === 'all' || filter === s.group.id)
  const activeCount = modules.filter(m => m.active).length
  const alerts = status?.alerts ?? []

  return (
    <>
      <PageHeader
        icon={<LayoutGrid className="size-[22px]" />}
        title={status?.user ? `Bonjour, ${status.user}` : 'Tableau de bord'}
        badge={<StatusBadge>{activeCount} module{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}</StatusBadge>}
        description="Retrouvez l'état de vos modules et ce qui demande votre attention."
        actions={
          <Button variant="outline" className={SECONDARY_BUTTON} asChild>
            <a href={LINKS.documentation} target="_blank" rel="noreferrer">
              <BookOpen className="size-4" />
              Documentation
            </a>
          </Button>
        }
      />

      <div className="flex flex-col gap-8 px-4 pt-7 pb-12 sm:px-8 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {alerts.length > 0 && <TodoCard alerts={alerts} modules={modules} onNavigate={onNavigate} />}

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-56 flex-1">
              <div role="heading" aria-level={2} className="text-[17px] font-semibold tracking-[-0.2px] text-foreground">Modules</div>
              <div className="mt-[3px] text-[13px] text-muted-foreground">Activez uniquement ce dont votre site a besoin.</div>
            </div>
            <div role="group" aria-label="Filtrer les modules" className="flex gap-0.5 rounded-lg bg-card p-0.5 ring-1 ring-border">
              {filters.map(f => {
                const active = filter === f.value
                return (
                  <Button
                    key={f.value}
                    type="button"
                    variant="ghost"
                    aria-pressed={active}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'h-7 rounded-md px-2.5 text-xs',
                      active
                        ? 'bg-muted font-semibold text-foreground ring-1 ring-border'
                        : 'font-medium text-muted-foreground'
                    )}
                  >
                    {f.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {modules.length === 0 ? (
            <Card className={PANEL}>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Aucun module disponible.
              </CardContent>
            </Card>
          ) : (
            sections.map(({ group, modules: groupModules }) => (
              <ModuleGroupCard
                key={group.id}
                group={group}
                modules={groupModules}
                alerts={alerts}
                onToggle={handleToggle}
                onNavigate={onNavigate}
              />
            ))
          )}
        </div>

        <aside className="flex shrink-0 flex-col gap-5 xl:w-[340px]">
          <PluginInfoCard status={status} />
          <ShopCard />
          <HelpCard version={version} />
        </aside>
      </div>
    </>
  )
}
