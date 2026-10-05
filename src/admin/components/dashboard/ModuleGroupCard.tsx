import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ModuleCategory, ModuleGroup } from '@/lib/modules'
import type { DashboardAlert, Module } from '@/lib/types'
import { ModuleRow } from './ModuleRow'
import { PANEL } from '../styles'

interface Props {
  group: ModuleGroup
  modules: Module[]
  alerts: DashboardAlert[]
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

const LOGOS: Record<ModuleCategory, { label: string; className: string }> = {
  wordpress: { label: 'W', className: 'bg-brand-wordpress text-[11px]' },
  woocommerce: { label: 'Woo', className: 'bg-brand-woocommerce text-[7.5px]' },
}

/** Un groupe de modules (WordPress, WooCommerce) : en-tête + une ligne par module. */
export function ModuleGroupCard({ group, modules, alerts, onToggle, onNavigate }: Props) {
  const activeCount = modules.filter(m => m.active).length
  const logo = LOGOS[group.id]

  return (
    <Card className={PANEL} role="region" aria-label={group.label}>
      <div className="flex items-center gap-2.5 bg-muted px-6 py-3">
        <span
          className={cn('flex size-[22px] shrink-0 items-center justify-center rounded-md font-bold text-inverse-foreground', logo.className)}
          aria-hidden
        >
          {logo.label}
        </span>
        <span className="text-[13px] font-semibold text-foreground">{group.label}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-subtle-foreground max-sm:hidden">{group.description}</span>
        <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
          {activeCount}/{modules.length} actif{activeCount > 1 ? 's' : ''}
        </span>
      </div>
      {modules.map(module => (
        <ModuleRow
          key={module.id}
          module={module}
          alertCount={alerts.filter(a => a.module === module.id).length}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
      ))}
    </Card>
  )
}
