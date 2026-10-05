import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PANEL } from './styles'

interface SectionProps {
  title: React.ReactNode
  description?: React.ReactNode
  /** Contrôle aligné à droite du titre */
  action?: React.ReactNode
  /** Contenu avec la marge interne standard ; à défaut, `children` est rendu tel quel (lignes bord à bord). */
  padded?: boolean
  children?: React.ReactNode
  className?: string
}

/** Carte de réglages : titre, description, puis contenu (composant « Section » des maquettes). */
export function SettingsSection({ title, description, action, padded = false, children, className }: SectionProps) {
  return (
    <Card className={cn(PANEL, className)}>
      <div className="flex items-center gap-4 px-6 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <div role="heading" aria-level={2} className="text-[15px] font-semibold text-foreground">{title}</div>
          {description && <div className="mt-1 text-[13px] text-muted-foreground">{description}</div>}
        </div>
        {action}
      </div>
      {children && (padded ? <div className="flex flex-col gap-3.5 px-6 pt-1 pb-6">{children}</div> : children)}
    </Card>
  )
}

interface RowProps {
  title: React.ReactNode
  description?: React.ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/** Ligne titre + description + switch, séparée par une bordure haute. */
export function SettingSwitchRow({ title, description, checked, onCheckedChange, disabled }: RowProps) {
  return (
    <label className="flex cursor-pointer items-center gap-6 border-t border-border px-6 py-4">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        {description && <span className="mt-[3px] block text-[13px] text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  )
}
