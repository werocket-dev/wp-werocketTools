import { ArrowRight, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ModuleIcon } from '@/lib/module-icons'
import type { DashboardAlert, Module } from '@/lib/types'
import { PANEL, ROW_ACTION_BUTTON } from './styles'

interface Props {
  alerts: DashboardAlert[]
  modules: Module[]
  onNavigate: (tab: string, section?: string) => void
}

/** Liste « À traiter » : réglages manquants ou risqués détectés côté serveur. */
export function TodoCard({ alerts, modules, onNavigate }: Props) {
  const moduleName = (id: string) => modules.find(m => m.id === id)?.name ?? id

  return (
    <Card className={PANEL}>
      <div className="flex items-center gap-2.5 px-6 pt-[18px] pb-3.5">
        <div role="heading" aria-level={2} className="text-[15px] font-semibold text-foreground">À traiter</div>
        <span className="flex h-5 items-center rounded-full bg-warning-muted px-[7px] text-xs font-bold text-warning tabular-nums">
          {alerts.length}
        </span>
        <span className="ml-auto text-xs text-subtle-foreground">Mis à jour à l'instant</span>
      </div>

      <ul>
        {alerts.map(alert => (
          <li key={alert.id} className="flex items-center gap-3.5 border-t border-border px-6 py-3.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warning-muted text-warning">
              <TriangleAlert className="size-[13px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{alert.title}</div>
              <div className="mt-[3px] flex flex-wrap items-center gap-x-1.5 text-xs">
                <ModuleIcon id={alert.module} className="size-3 text-subtle-foreground" />
                <span className="font-medium text-muted-foreground">{moduleName(alert.module)}</span>
                <span className="text-subtle-foreground" aria-hidden>·</span>
                <span className="text-subtle-foreground">{alert.hint}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className={ROW_ACTION_BUTTON}
              onClick={() => onNavigate(alert.module, alert.section || undefined)}
            >
              {alert.action}
              <ArrowRight className="size-[13px]" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
