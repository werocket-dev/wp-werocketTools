import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconSettings } from '@tabler/icons-react'
import { api } from '@/lib/api'
import { getModuleCategory } from '@/lib/modules'
import { ModuleIcon } from '@/lib/module-icons'
import type { Module } from '@/lib/types'

interface Props {
  module: Module
  onToggle: (id: string, active: boolean) => void
  onNavigate: (tab: string) => void
}

// #F2EDFF fond de card · #873EFF boutons/switch · override CSS vars shadcn
const WOO_VARS = {
  '--card': '#F2EDFF',
  '--primary': '#873EFF',
  '--primary-foreground': '#ffffff',
  '--ring': '#873EFF',
} as React.CSSProperties

export function ModuleCard({ module, onToggle, onNavigate }: Props) {
  const [loading, setLoading] = useState(false)
  const isWoo = getModuleCategory(module.id) === 'woocommerce'

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
    <div style={isWoo ? WOO_VARS : undefined}>
      <Card className="h-full hover:ring-foreground/10 transition-all">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ModuleIcon id={module.id} size={20} />
            </div>
            <CardTitle className="text-base font-bold">{module.name}</CardTitle>
          </div>
          <CardAction>
            <Switch
              checked={module.active}
              onCheckedChange={handleToggle}
              disabled={loading}
              aria-label={`Activer ${module.name}`}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <Badge variant={module.active ? 'default' : 'secondary'}>
            <span className={`w-1.5 h-1.5 rounded-full ${module.active ? 'bg-primary-foreground' : 'bg-muted-foreground/60'}`} />
            {module.active ? 'Actif' : 'Inactif'}
          </Badge>
          <CardDescription className="leading-relaxed">{module.description}</CardDescription>
        </CardContent>
        <CardFooter className="mt-auto">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 gap-2 text-[15px]"
            onClick={() => onNavigate(module.id)}
          >
            <IconSettings className="size-[18px]" />
            Configurer
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
