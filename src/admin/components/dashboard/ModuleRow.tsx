import { useState } from 'react'
import { toast } from 'sonner'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { ModuleIcon } from '@/lib/module-icons'
import type { Module } from '@/lib/types'
import { StatusBadge } from '../StatusBadge'
import { SECONDARY_BUTTON } from './styles'

interface Props {
  module: Module
  /** Nombre d'alertes « À traiter » du module */
  alertCount: number
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

export function ModuleRow({ module, alertCount, onToggle, onNavigate }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleToggle(checked: boolean) {
    setLoading(true)
    try {
      await api.post(`/modules/${module.id}/toggle`, { active: checked })
      onToggle(module.id, checked)
      toast.success(checked ? `${module.name} activé` : `${module.name} désactivé`)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const badge = !module.active
    ? <StatusBadge tone="neutral">Inactif</StatusBadge>
    : alertCount > 0
      ? <StatusBadge tone="warning">{alertCount} point{alertCount > 1 ? 's' : ''} à vérifier</StatusBadge>
      : <StatusBadge>Actif</StatusBadge>

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border px-6 py-[18px] sm:flex-nowrap">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-muted text-primary">
        <ModuleIcon id={module.id} className="size-[19px]" />
      </div>
      <div className="min-w-0 flex-1 basis-60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-semibold text-foreground">{module.name}</span>
          {badge}
        </div>
        <div className="mt-1 text-[13px] leading-[1.45] text-muted-foreground">{module.description}</div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <Switch
          checked={module.active}
          onCheckedChange={handleToggle}
          disabled={loading}
          aria-label={`Activer ${module.name}`}
        />
        <Button variant="outline" className={SECONDARY_BUTTON} onClick={() => onNavigate(module.id)}>
          <Settings2 className="size-4" />
          Configurer
        </Button>
      </div>
    </div>
  )
}
