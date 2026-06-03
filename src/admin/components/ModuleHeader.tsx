import { Button } from '@/components/ui/button'
import { IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react'

interface Props {
  icon: React.ReactNode
  title: string
  description: string
  saving?: boolean
}

export function ModuleHeader({ icon, title, description, saving }: Props) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-border px-6 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={saving} className="gap-2">
        {saving ? <IconLoader2 size={15} className="animate-spin" /> : <IconDeviceFloppy size={15} />}
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </div>
  )
}
