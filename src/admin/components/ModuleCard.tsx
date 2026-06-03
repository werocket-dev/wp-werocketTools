import { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { IconSettings } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Module } from '@/lib/types'

interface Props {
  module: Module
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

export function ModuleCard({ module, onToggle, onNavigate }: Props) {
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

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* Header : icône + nom + toggle */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"
            dangerouslySetInnerHTML={{ __html: module.icon }}
          />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{module.name}</h3>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
              module.active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            )}>
              {module.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        <Switch
          checked={module.active}
          onCheckedChange={handleToggle}
          disabled={loading}
          aria-label={`Activer ${module.name}`}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 leading-relaxed flex-1">{module.description}</p>

      {/* Bouton configurer */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-gray-600 hover:text-emerald-600 hover:border-emerald-300"
        onClick={() => onNavigate(module.id)}
      >
        <IconSettings size={15} />
        Configurer
      </Button>
    </div>
  )
}
