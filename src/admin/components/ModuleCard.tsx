import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconSettings } from '@tabler/icons-react'
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
    <Card className="flex flex-col gap-0 hover:shadow-md transition-shadow">
      <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"
            dangerouslySetInnerHTML={{ __html: module.icon }}
          />
          <div>
            <CardTitle className="text-base">{module.name}</CardTitle>
            <Badge variant={module.active ? 'default' : 'secondary'} className="mt-1 text-xs">
              {module.active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
        <Switch
          checked={module.active}
          onCheckedChange={handleToggle}
          disabled={loading}
          aria-label={`Activer ${module.name}`}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CardDescription className="text-sm leading-relaxed">{module.description}</CardDescription>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => onNavigate(module.id)}
        >
          <IconSettings size={15} />
          Configurer
        </Button>
      </CardContent>
    </Card>
  )
}
